package fi.liikennevirasto.digiroad2.linearasset.oracle

import fi.liikennevirasto.digiroad2.LinkChain.GeometryDirection.GeometryDirection
import fi.liikennevirasto.digiroad2.LinkChain.GeometryDirection.TowardsLinkChain
import fi.liikennevirasto.digiroad2.LinkChain.GeometryDirection.AgainstLinkChain
import fi.liikennevirasto.digiroad2._
import fi.liikennevirasto.digiroad2.asset.BoundingRectangle
import fi.liikennevirasto.digiroad2.asset.oracle.{AssetPropertyConfiguration, Queries}
import fi.liikennevirasto.digiroad2.linearasset._
import fi.liikennevirasto.digiroad2.oracle.OracleDatabase._
import fi.liikennevirasto.digiroad2.user.UserProvider
import scala.slick.driver.JdbcDriver.backend.Database
import Database.dynamicSession
import scala.slick.jdbc.{StaticQuery => Q}
import org.slf4j.LoggerFactory
import fi.liikennevirasto.digiroad2.asset.AdministrativeClass

// FIXME:
// - rename to speed limit service
// - move common asset functionality to asset service
class OracleLinearAssetProvider(eventbus: DigiroadEventBus, roadLinkServiceImplementation: RoadLinkService = RoadLinkService) extends LinearAssetProvider {
  val dao: OracleLinearAssetDao = new OracleLinearAssetDao {
    override val roadLinkService: RoadLinkService = roadLinkServiceImplementation
  }
  val logger = LoggerFactory.getLogger(getClass)
  def withDynTransaction[T](f: => T): T = Database.forDataSource(ds).withDynTransaction(f)

  private def toSpeedLimit(linkAndPositionNumber: (Long, Long, Int, Option[Int], Seq[Point], Int, GeometryDirection)): SpeedLimitLink = {
    val (id, roadLinkId, sideCode, limit, points, positionNumber, geometryDirection) = linkAndPositionNumber

    val towardsLinkChain = geometryDirection match {
      case TowardsLinkChain => true
      case AgainstLinkChain => false
    }

    SpeedLimitLink(id, roadLinkId, sideCode, limit, points, positionNumber, towardsLinkChain)
  }

  private def getLinkEndpoints(link: (Long, Long, Int, Option[Int], Seq[Point])): (Point, Point) = {
    val (_, _, _, _, points) = link
    GeometryUtils.geometryEndpoints(points)
  }

  private def getLinksWithPositions(links: Seq[(Long, Long, Int, Option[Int], Seq[Point])]): Seq[SpeedLimitLink] = {
    val linkChain = LinkChain(links, getLinkEndpoints)
    linkChain.map { chainedLink =>
      val (id, roadLinkId, sideCode, limit, points) = chainedLink.rawLink
      toSpeedLimit((id, roadLinkId, sideCode, limit, points, chainedLink.linkPosition, chainedLink.geometryDirection))
    }
  }
  
  private def hasEmptySegments(speedLimit: (Long, Seq[(Long, Long, Int, Option[Int], Seq[Point])])): Boolean = {
    val (_, links) = speedLimit
    links.exists { case (_, _, _, _, geometry) => geometry.isEmpty }
  }

  private def hasGaps(speedLimit: (Long, Seq[(Long, Long, Int, Option[Int], Seq[Point])])) = {
    val (_, links) = speedLimit
    val maximumGapThreshold = 1
    LinkChain(links, getLinkEndpoints).linkGaps().exists(_ > maximumGapThreshold)
  }

  private def adjustSpeedLimit(linkGeometries: Map[Long, RoadLinkForSpeedLimit])(speedLimit: (Long, Seq[(Long, Long, Int, Option[Int], Seq[Point])])):
  (Long, Seq[(Long, Long, Int, Option[Int], Seq[Point])]) = {
    val (id, links) = speedLimit
    if (links.length > 2) {
      val linkChain = LinkChain(links, getLinkEndpoints)
      val middleSegments = linkChain.withoutEndSegments()
      val adjustedSegments = middleSegments.map { chainedLink =>
        val roadLinkGeometry = linkGeometries.get(chainedLink.rawLink._2).map(_.geometry)
        roadLinkGeometry.map { newGeometry =>
          chainedLink.rawLink.copy(_5 = newGeometry)
        }.getOrElse(chainedLink.rawLink)
      }
      id -> (Seq(linkChain.head().rawLink) ++ adjustedSegments ++ Seq(linkChain.last().rawLink))
    }
    else {
      speedLimit
    }
  }

  override def getSpeedLimits(bounds: BoundingRectangle, municipalities: Set[Int]): Seq[SpeedLimitLink] = {
    withDynTransaction {
      val (speedLimitLinks, linkGeometries) = dao.getSpeedLimitLinksByBoundingBox(bounds, municipalities)
      val speedLimits = speedLimitLinks.groupBy(_._1)
      
      val (speedLimitsWithEmptySegments, speedLimitsWithoutEmptySegments) = speedLimits.partition(hasEmptySegments)
      val adjustedSpeedLimits = speedLimitsWithoutEmptySegments.map(adjustSpeedLimit(linkGeometries))
      val (speedLimitsWithGaps, validLimits) = adjustedSpeedLimits.partition(hasGaps)
      dao.markSpeedLimitsFloating(speedLimitsWithEmptySegments.keySet ++ speedLimitsWithGaps.keySet)

      eventbus.publish("speedLimits:linkGeometriesRetrieved", linkGeometries)
      validLimits.mapValues(getLinksWithPositions).values.flatten.toSeq
    }
  }

  override def getSpeedLimit(speedLimitId: Long): Option[SpeedLimit] = {
    withDynTransaction {
      loadSpeedLimit(speedLimitId)
    }
  }

  private def loadSpeedLimit(speedLimitId: Long): Option[SpeedLimit] = {
    val links = dao.getSpeedLimitLinksById(speedLimitId)
    if (links.isEmpty) None
    else {
      val linkEndpoints: List[(Point, Point)] = links.map(getLinkEndpoints).toList
      val limitEndpoints = LinearAsset.calculateEndPoints(linkEndpoints)
      val (modifiedBy, modifiedDateTime, createdBy, createdDateTime, limit) = dao.getSpeedLimitDetails(speedLimitId)
      Some(SpeedLimit(speedLimitId, limit, limitEndpoints,
        modifiedBy, modifiedDateTime.map(AssetPropertyConfiguration.DateTimePropertyFormat.print),
        createdBy, createdDateTime.map(AssetPropertyConfiguration.DateTimePropertyFormat.print),
        getLinksWithPositions(links)))
    }
  }

  override def updateSpeedLimitValue(id: Long, value: Int, username: String, municipalityValidation: Int => Unit): Option[Long] = {
    Database.forDataSource(ds).withDynTransaction {
      dao.updateSpeedLimitValue(id, value, username, municipalityValidation)
    }
  }

  override def updateSpeedLimitValues(ids: Seq[Long], value: Int, username: String, municipalityValidation: Int => Unit): Seq[Long] = {
    Database.forDataSource(ds).withDynTransaction {
      ids.map(dao.updateSpeedLimitValue(_, value, username, municipalityValidation)).flatten
    }
  }

  override def splitSpeedLimit(id: Long, mmlId: Long, splitMeasure: Double, limit: Int, username: String, municipalityValidation: Int => Unit): Seq[SpeedLimit] = {
    Database.forDataSource(ds).withDynTransaction {
      val newId = dao.splitSpeedLimit(id, mmlId, splitMeasure, limit, username, municipalityValidation)
      Seq(loadSpeedLimit(id).get, loadSpeedLimit(newId).get)
    }
  }

  override def fillPartiallyFilledRoadLinks(linkGeometries: Map[Long, RoadLinkForSpeedLimit]): Unit = {
    Database.forDataSource(ds).withDynTransaction {
      logger.info("Filling partially filled road links, road link count in bounding box: " + linkGeometries.size)
      OracleLinearAssetDao.fillPartiallyFilledRoadLinks(linkGeometries)
      logger.info("...done with filling.")
    }
  }

  override def getSpeedLimits(municipality: Int): Seq[Map[String, Any]] = {
    Database.forDataSource(ds).withDynTransaction {
      dao.getByMunicipality(municipality)
    }
  }
}
