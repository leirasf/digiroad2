package fi.liikennevirasto.digiroad2

import java.text.{DecimalFormat, NumberFormat}
import java.util.Locale
import org.joda.time.LocalDate
import scala.slick.driver.JdbcDriver.backend.Database
import scala.slick.driver.JdbcDriver.backend.Database.dynamicSession
import scala.slick.jdbc.GetResult
import scala.slick.jdbc.PositionedResult
import scala.slick.jdbc.StaticQuery.interpolation
import scala.slick.jdbc.{StaticQuery => Q}
import com.jolbox.bonecp.BoneCPConfig
import com.jolbox.bonecp.BoneCPDataSource
import fi.liikennevirasto.digiroad2.asset.{RoadLink, BoundingRectangle, RoadLinkType}
import fi.liikennevirasto.digiroad2.oracle.OracleDatabase
import fi.liikennevirasto.digiroad2.user.User
import _root_.oracle.spatial.geometry.JGeometry
import fi.liikennevirasto.digiroad2.oracle.collections.OracleArray
import fi.liikennevirasto.digiroad2.asset.oracle.Queries.bonecpToInternalConnection
import _root_.oracle.jdbc.OracleConnection
import collection.JavaConversions._
import fi.liikennevirasto.digiroad2.LinkChain.GeometryDirection.GeometryDirection
import fi.liikennevirasto.digiroad2.LinkChain.GeometryDirection.TowardsLinkChain
import fi.liikennevirasto.digiroad2.LinkChain.GeometryDirection.AgainstLinkChain

object TotalWeightLimitService {
  lazy val dataSource = {
    val cfg = new BoneCPConfig(OracleDatabase.loadProperties("/conversion.bonecp.properties"))
    new BoneCPDataSource(cfg)
  }

  case class TotalWeightLimitLink(id: Long, roadLinkId: Long, sideCode: Int, value: Int, points: Seq[Point], position: Option[Int] = None, towardsLinkChain: Option[Boolean] = None)
  case class TotalWeightLimit(id: Long, limit: Int, endpoints: Set[Point])

  private def getLinksWithPositions(links: Seq[TotalWeightLimitLink]): Seq[TotalWeightLimitLink] = {
    def getLinkEndpoints(link: TotalWeightLimitLink): (Point, Point) = GeometryUtils.geometryEndpoints(link.points)
    val linkChain = LinkChain(links, getLinkEndpoints)
    linkChain.map { chainedLink =>
      val rawLink = chainedLink.rawLink
      val towardsLinkChain = chainedLink.geometryDirection match {
        case TowardsLinkChain => true
        case AgainstLinkChain => false
      }
      rawLink.copy(position = Some(chainedLink.linkPosition), towardsLinkChain = Some(towardsLinkChain))
    }
  }

  private def calculateEndPoints(links: List[(Point, Point)]): Set[Point] = {
    val endPoints = LinkChain(links, identity[(Point, Point)]).endPoints(identity[(Point, Point)])
    Set(endPoints._1, endPoints._2)
  }

  private def totalWeightLimitLinksById(id: Long): Seq[(Long, Long, Int, Int, Seq[Point])] = {
    val totalWeightLimits = sql"""
        select segm_id, tielinkki_id, puoli, arvo, alkum, loppum
          from segments
          where tyyppi = 22
          and segm_id = $id
        """.as[(Long, Long, Int, Int, Double, Double)].list
    totalWeightLimits.map { case (segmentId, roadLinkId, sideCode, value, startMeasure, endMeasure) =>
      val points = RoadLinkService.getRoadLinkGeometry(roadLinkId, startMeasure, endMeasure)
      (segmentId, roadLinkId, sideCode, value, points)
    }
  }

  def getByBoundingBox(bounds: BoundingRectangle, municipalities: Set[Int] = Set()): Seq[TotalWeightLimitLink] = {
    Database.forDataSource(dataSource).withDynTransaction {
      val roadLinks = RoadLinkService.getRoadLinks(bounds, false, municipalities)
      val roadLinkIds = roadLinks.map(_._1).toList

      val totalWeightLimits = OracleArray.fetchTotalWeightLimitsByRoadLinkIds(roadLinkIds, bonecpToInternalConnection(dynamicSession.conn))

      val linkGeometries: Map[Long, (Seq[Point], Double, RoadLinkType, Int)] =
      roadLinks.foldLeft(Map.empty[Long, (Seq[Point], Double, RoadLinkType, Int)]) { (acc, roadLink) =>
          acc + (roadLink._1 -> (roadLink._2, roadLink._3, roadLink._4, roadLink._5))
        }

      val totalWeightLimitsWithGeometry: Seq[TotalWeightLimitLink] = totalWeightLimits.map { link =>
        val (assetId, roadLinkId, sideCode, speedLimit, startMeasure, endMeasure) = link
        val geometry = GeometryUtils.truncateGeometry(linkGeometries(roadLinkId)._1, startMeasure, endMeasure)
        TotalWeightLimitLink(assetId, roadLinkId, sideCode, speedLimit, geometry)
      }

      totalWeightLimitsWithGeometry.groupBy(_.id).mapValues(getLinksWithPositions).values.flatten.toSeq
    }
  }

  def getById(id: Long): Option[TotalWeightLimit] = {
    def getLinkEndpoints(link: (Long, Long, Int, Int, Seq[Point])): (Point, Point) = {
      val (_, _, _, _, points) = link
      GeometryUtils.geometryEndpoints(points)
    }

    Database.forDataSource(dataSource).withDynTransaction {
      val links = totalWeightLimitLinksById(id)
      if (links.isEmpty) None
      else {
        val linkEndpoints: List[(Point, Point)] = links.map(getLinkEndpoints).toList
        val limitEndpoints = calculateEndPoints(linkEndpoints)
        val limit = links.head._4
        Some(TotalWeightLimit(id, limit, limitEndpoints))
      }
    }
  }
}