package fi.liikennevirasto.viite.util

import java.util.Properties

import fi.liikennevirasto.digiroad2.{DummyEventBus, DummySerializer, RoadLinkService, VVHClient}
import fi.liikennevirasto.digiroad2.oracle.OracleDatabase
import fi.liikennevirasto.viite.dao.RoadAddressDAO
import fi.liikennevirasto.viite.RoadAddressService
import fi.liikennevirasto.viite.process.{ContinuityChecker, FloatingChecker, LinkRoadAddressCalculator}
import fi.liikennevirasto.viite.util.AssetDataImporter.Conversion
import org.joda.time.DateTime
import slick.jdbc.{StaticQuery => Q}

object DataFixture {
  val TestAssetId = 300000
  lazy val properties: Properties = {
    val props = new Properties()
    props.load(getClass.getResourceAsStream("/bonecp.properties"))
    props
  }
  lazy val dr2properties: Properties = {
    val props = new Properties()
    props.load(getClass.getResourceAsStream("/digiroad2.properties"))
    props
  }

  val dataImporter = new AssetDataImporter
  lazy val vvhClient: VVHClient = {
    new VVHClient(dr2properties.getProperty("digiroad2.VVHRestApiEndPoint"))
  }

  lazy val continuityChecker = new ContinuityChecker(new RoadLinkService(vvhClient, new DummyEventBus, new DummySerializer))

  private def loopRoadParts(roadNumber: Int) = {
    var partNumberOpt = RoadAddressDAO.fetchNextRoadPartNumber(roadNumber, 0)
    while (partNumberOpt.nonEmpty) {
      val partNumber = partNumberOpt.get
      val roads = RoadAddressDAO.fetchByRoadPart(roadNumber, partNumber)
      val adjusted = LinkRoadAddressCalculator.recalculate(roads)
      assert(adjusted.size == roads.size) // Must not lose any
      val (changed, unchanged) = adjusted.partition(ra =>
        roads.exists(oldra => ra.id == oldra.id && (oldra.startAddrMValue != ra.startAddrMValue || oldra.endAddrMValue != ra.endAddrMValue))
      )
      println(s"Road $roadNumber, part $partNumber: ${changed.size} updated, ${unchanged.size} kept unchanged")
      changed.foreach(addr => RoadAddressDAO.update(addr, None))
      partNumberOpt = RoadAddressDAO.fetchNextRoadPartNumber(roadNumber, partNumber)
    }
  }

  def recalculate():Unit = {
    OracleDatabase.withDynTransaction {
      var roadNumberOpt = RoadAddressDAO.fetchNextRoadNumber(0)
      while (roadNumberOpt.nonEmpty) {
        loopRoadParts(roadNumberOpt.get)
        roadNumberOpt = RoadAddressDAO.fetchNextRoadNumber(roadNumberOpt.get)
      }
    }
  }

  def importRoadAddresses(): Unit = {
    println(s"\nCommencing road address import from conversion at time: ${DateTime.now()}")
    val vvhClient = new VVHClient(dr2properties.getProperty("digiroad2.VVHRestApiEndPoint"))
    dataImporter.importRoadAddressData(Conversion.database(), vvhClient)
    println(s"Road address import complete at time: ${DateTime.now()}")
    println()
  }

  def updateMissingRoadAddresses(): Unit = {
    println(s"\nUpdating missing road address table at time: ${DateTime.now()}")
    val vvhClient = new VVHClient(dr2properties.getProperty("digiroad2.VVHRestApiEndPoint"))
    dataImporter.updateMissingRoadAddresses(vvhClient)
    println(s"Missing address update complete at time: ${DateTime.now()}")
    println()
  }

  def findFloatingRoadAddresses(): Unit = {
    println(s"\nFinding road addresses that are floating at time: ${DateTime.now()}")
    val vvhClient = new VVHClient(dr2properties.getProperty("digiroad2.VVHRestApiEndPoint"))
    val roadLinkService = new RoadLinkService(vvhClient, new DummyEventBus, new DummySerializer)
    OracleDatabase.withDynTransaction {
      val checker = new FloatingChecker(roadLinkService)
      val roads = checker.checkRoadNetwork()
      println(s"${roads.size} segment(s) found")
      roads.foreach(r => RoadAddressDAO.changeRoadAddressFloating(float = true, r.id, None))
    }
    println(s"\nRoad Addresses floating field update complete at time: ${DateTime.now()}")
    println()
  }

  def testRoadlinkFetching(): Unit = {
    println(s"Testing getting road addresses by municipality at time: ${DateTime.now}")
    val vvhClient = new VVHClient(dr2properties.getProperty("digiroad2.VVHRestApiEndPoint"))
    val roadLinkService = new RoadLinkService(vvhClient, new DummyEventBus, new DummySerializer)
    val roadAddressService = new RoadAddressService(roadLinkService, new DummyEventBus)
    //val municipalityCode = 235
    val municipalityCode = 749
    val roadAddressLinks = roadAddressService.getRoadAddressesLinkByMunicipality(municipalityCode)
    println(s"Ammount of roadAddressLinks fetched: ${roadAddressLinks.length}")
    roadAddressLinks.foreach(ral => {
      println(s"Road Address Link: ${ral.toString}")
    })
  }

  def main(args:Array[String]) : Unit = {
    import scala.util.control.Breaks._
    val username = properties.getProperty("bonecp.username")
    if (!username.startsWith("dr2dev")) {
      println("*************************************************************************************")
      println("YOU ARE RUNNING FIXTURE RESET AGAINST A NON-DEVELOPER DATABASE, TYPE 'YES' TO PROCEED")
      println("*************************************************************************************")
      breakable {
        while (true) {
          val input = Console.readLine()
          if (input.trim() == "YES") {
            break()
          }
        }
      }
    }

    args.headOption match {
      case Some ("find_floating_road_addresses") =>
        findFloatingRoadAddresses()
      case Some ("import_road_addresses") =>
        importRoadAddresses()
      case Some ("recalculate_addresses") =>
        recalculate()
      case Some ("update_missing") =>
        updateMissingRoadAddresses()
      case Some("test_roadlink_fetching") =>
        testRoadlinkFetching()
      case _ => println("Usage: DataFixture import_road_addresses | recalculate_addresses | update_missing | find_floating_road_addresses")
    }
  }
}
