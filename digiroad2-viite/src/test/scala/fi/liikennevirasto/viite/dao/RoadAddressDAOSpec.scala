package fi.liikennevirasto.viite.dao

import fi.liikennevirasto.digiroad2.Point
import fi.liikennevirasto.digiroad2.asset.TrafficDirection.BothDirections
import fi.liikennevirasto.digiroad2.asset.{BoundingRectangle, Private, SingleCarriageway}
import fi.liikennevirasto.digiroad2.linearasset.RoadLink
import fi.liikennevirasto.digiroad2.oracle.OracleDatabase
import org.scalatest.{FunSuite, Matchers}
import slick.driver.JdbcDriver.backend.Database
import slick.driver.JdbcDriver.backend.Database.dynamicSession
import slick.jdbc.StaticQuery
import slick.jdbc.StaticQuery.interpolation

/**
  * Created by venholat on 12.9.2016.
  */
class RoadAddressDAOSpec extends FunSuite with Matchers {

  def runWithRollback(f: => Unit): Unit = {
    Database.forDataSource(OracleDatabase.ds).withDynTransaction {
      f
      dynamicSession.rollback()
    }
  }

  test("testFetchByRoadPart") {
    runWithRollback {
      RoadAddressDAO.fetchByRoadPart(5L, 201L).isEmpty should be(false)
    }
  }

  test("testFetchByLinkId") {
    runWithRollback {
      val sets = RoadAddressDAO.fetchByLinkId(Set(5170942, 5170947))
      sets.size should be (2)
      sets.forall(_.floating == false) should be (true)
    }
  }

  test("Get valid road numbers") {
    runWithRollback {
      val numbers = RoadAddressDAO.getValidRoadNumbers
      numbers.isEmpty should be(false)
      numbers should contain(5L)
    }
  }

  test("Get valid road part numbers") {
    runWithRollback {
      val numbers = RoadAddressDAO.getValidRoadParts(5L)
      numbers.isEmpty should be(false)
      numbers should contain(201L)
    }
  }

  test("Update without geometry") {
    runWithRollback {
      val address = RoadAddressDAO.fetchByLinkId(Set(5170942)).head
      RoadAddressDAO.update(address)
    }
  }

  test("Updating a geometry is executed in SQL server") {
    runWithRollback {
      val address = RoadAddressDAO.fetchByLinkId(Set(5170942)).head
      RoadAddressDAO.update(address, Some(Seq(Point(50200, 7630000.0, 0.0), Point(50210, 7630000.0, 10.0))))
      RoadAddressDAO.fetchByBoundingBox(BoundingRectangle(Point(50202, 7620000), Point(50205, 7640000)), false).
        _1.exists(_.id == address.id) should be (true)
      RoadAddressDAO.fetchByBoundingBox(BoundingRectangle(Point(50212, 7620000), Point(50215, 7640000)), false).
        _1.exists(_.id == address.id) should be (false)
    }
  }


  test("Set road address to floating and update the geometry as well") {
    runWithRollback {
      val address = RoadAddressDAO.fetchByLinkId(Set(5170942)).head
      RoadAddressDAO.changeRoadAddressFloating(true, address.id, Some(Seq(Point(50200, 7630000.0, 0.0), Point(50210, 7630000.0, 10.0))))
    }
  }

  test("Update the geometry of road addresses with bad geometry") {
    runWithRollback {
      val roadlink = RoadLink(6394248,List(Point(429740.579,7200061.79,10.032999999995809), Point(429747.518,7200065.597,9.915999999997439), Point(429756.039,7200072.55,9.52400000000489), Point(429766.585,7200076.907,9.221999999994296), Point(429779.429,7200080.914,9.028999999994994), Point(429801.35,7200086.303,9.327000000004773)),66.3513453818142,Private,6,BothDirections,SingleCarriageway,Some("12.12.2016 12:49:36"),Some("automatic_generation"),Map("LAST_EDITED_DATE" -> "", "MTKHEREFLIP" -> 0,"MTKID" -> 1692552374, "VERTICALACCURACY" -> 201, "VALIDFROM" -> "", "CONSTRUCTIONTYPE" -> 0, "SURFACETYPE" -> 1, "points" -> List(Map("x" -> 429740.579, "y" -> 7200061.79, "z" -> 10.032999999995809, "m" -> 0), Map("x" -> 429747.518, "y" -> 7200065.597, "z" -> 9.915999999997439, "m" -> 7.9146999999939), Map("x" -> 429756.039, "y" -> 7200072.55, "z" -> 9.52400000000489,"m" -> 18.91250000000582), Map("x" -> 429766.585, "y" -> 7200076.907, "z" -> 9.221999999994296, "m" -> 30.323099999994156), Map("x" -> 429779.429, "y" -> 7200080.914, "z" -> 9.028999999994994, "m" -> 43.77770000000601), Map("x" -> 429801.35, "y" -> 7200086.303, "z" -> 9.327000000004773, "m" -> 66.35129999999481)), "geometryWKT" -> "LINESTRING ZM (429740.579 7200061.79 10.032999999995809 0, 429747.518 7200065.597 9.915999999997439 7.9146999999939, 429756.039 7200072.55 9.52400000000489 18.91250000000582, 429766.585 7200076.907 9.221999999994296 30.323099999994156, 429779.429 7200080.914 9.028999999994994 43.77770000000601, 429801.35 7200086.303 9.327000000004773 66.35129999999481)", "VERTICALLEVEL" -> 0, "MUNICIPALITYCODE" -> 244, "CREATED_DATE" -> "", "HORIZONTALACCURACY"-> 3000))
      RoadAddressDAO.changeRoadAddressGeometry(roadlink)
    }
  }
}
