package fi.liikennevirasto.digiroad2

import com.jolbox.bonecp.{BoneCPConfig, BoneCPDataSource}
import fi.liikennevirasto.digiroad2.masstransitstop.oracle.Queries
import fi.liikennevirasto.digiroad2.asset.{BoundingRectangle, FloatingAsset, Unknown}
import fi.liikennevirasto.digiroad2.oracle.OracleDatabase
import fi.liikennevirasto.digiroad2.user.User
import org.slf4j.LoggerFactory
import slick.driver.JdbcDriver.backend.Database.dynamicSession
import slick.jdbc.StaticQuery
import slick.jdbc.StaticQuery.interpolation

trait IncomingPointAsset {
  val lon: Double
  val lat: Double
  val linkId: Long
}

trait PointAsset extends FloatingAsset {
  val municipalityCode: Int
}

trait PersistedPointAsset extends PointAsset with IncomingPointAsset {
  val id: Long
  val lon: Double
  val lat: Double
  val municipalityCode: Int
  val linkId: Long
  val mValue: Double
  val floating: Boolean
}

trait PointAssetOperations {
  type IncomingAsset <: IncomingPointAsset
  type PersistedAsset <: PersistedPointAsset

  def vvhClient: VVHClient
  val idField = "id"

  lazy val dataSource = {
    val cfg = new BoneCPConfig(OracleDatabase.loadProperties("/bonecp.properties"))
    new BoneCPDataSource(cfg)
  }
  def withDynTransaction[T](f: => T): T = OracleDatabase.withDynTransaction(f)
  def withDynSession[T](f: => T): T = OracleDatabase.withDynSession(f)
  def typeId: Int
  def fetchPointAssets(queryFilter: String => String, roadLinks: Seq[VVHRoadlink] = Nil): Seq[PersistedAsset]
  def setFloating(persistedAsset: PersistedAsset, floating: Boolean): PersistedAsset
  def create(asset: IncomingAsset, username: String, geometry: Seq[Point], municipality: Int): Long
  def update(id:Long, updatedAsset: IncomingAsset, geometry: Seq[Point], municipality: Int, username: String): Long

  def getByBoundingBox(user: User, bounds: BoundingRectangle): Seq[PersistedAsset] = {
    case class AssetBeforeUpdate(asset: PersistedAsset, persistedFloating: Boolean)

    val roadLinks: Seq[VVHRoadlink] = vvhClient.fetchVVHRoadlinks(bounds)
    withDynSession {
      val boundingBoxFilter = OracleDatabase.boundingBoxFilter(bounds, "a.geometry")
      val filter = s"where a.asset_type_id = $typeId and $boundingBoxFilter"
      val persistedAssets: Seq[PersistedAsset] = fetchPointAssets(withFilter(filter), roadLinks)

      val assetsBeforeUpdate: Seq[AssetBeforeUpdate] = persistedAssets.filter { persistedAsset =>
        user.isAuthorizedToRead(persistedAsset.municipalityCode)
      }.map { (persistedAsset: PersistedAsset) =>
        val floating = PointAssetOperations.isFloating(persistedAsset, roadLinks.find(_.linkId == persistedAsset.linkId).map(link => (link.municipalityCode, link.geometry)))
        if (floating && !persistedAsset.floating) {
          val logger = LoggerFactory.getLogger(getClass)
          logger.info("Floating asset %d, reason: %s".format(persistedAsset.id, floatingReason(persistedAsset, roadLinks.find(_.linkId == persistedAsset.linkId))))
        }
        AssetBeforeUpdate(setFloating(persistedAsset, floating), persistedAsset.floating)
      }

      assetsBeforeUpdate.foreach { asset =>
        if (asset.asset.floating != asset.persistedFloating) {
          updateFloating(asset.asset.id, asset.asset.floating)
        }
      }

      assetsBeforeUpdate.map(_.asset)
    }
  }

  def getFloatingAssets(includedMunicipalities: Option[Set[Int]]): Map[String, Map[String, Seq[Long]]] = {
    case class FloatingAsset(id: Long, municipality: String, administrativeClass: String)

    withDynSession {
      val optionalMunicipalities = includedMunicipalities.map(_.mkString(","))
      val allFloatingAssetsQuery = s"""
        select a.$idField, m.name_fi, lrm.link_id
        from asset a
        join municipality m on a.municipality_code = m.id
        join asset_link al on a.id = al.asset_id
        join lrm_position lrm on al.position_id = lrm.id
        where asset_type_id = $typeId and floating = '1' and (valid_to is null or valid_to > sysdate)"""

      val sql = optionalMunicipalities match {
        case Some(municipalities) => allFloatingAssetsQuery + s" and municipality_code in ($municipalities)"
        case _ => allFloatingAssetsQuery
      }

      val result = StaticQuery.queryNA[(Long, String, Long)](sql).list
      val administrativeClasses = vvhClient.fetchVVHRoadlinks(result.map(_._3).toSet).groupBy(_.linkId).mapValues(_.head.administrativeClass)

      result
        .map { case (id, municipality, administrativeClass) =>
          FloatingAsset(id, municipality, administrativeClasses.getOrElse(administrativeClass, Unknown).toString)
        }
        .groupBy(_.municipality)
        .mapValues { municipalityAssets =>
          municipalityAssets
            .groupBy(_.administrativeClass)
            .mapValues(_.map(_.id))
        }
    }
  }

  def getByMunicipality(municipalityCode: Int): Seq[PersistedAsset] = {
    val roadLinks = vvhClient.fetchByMunicipality(municipalityCode)
    def findRoadlink(linkId: Long): Option[(Int, Seq[Point])] =
      roadLinks.find(_.linkId == linkId).map(x => (x.municipalityCode, x.geometry))

    withDynSession {
      fetchPointAssets(withMunicipality(municipalityCode))
        .map(withFloatingUpdate(convertPersistedAsset(setFloating, findRoadlink)))
        .toList
    }
  }

  def getById(id: Long): Option[PersistedAsset] = {
    val persistedAsset = getPersistedAssetsByIds(Set(id)).headOption
    val roadLinks: Option[VVHRoadlink] = persistedAsset.flatMap { x => vvhClient.fetchVVHRoadlink(x.linkId) }

    def findRoadlink(linkId: Long): Option[(Int, Seq[Point])] =
      roadLinks.find(_.linkId == linkId).map(x => (x.municipalityCode, x.geometry))

    withDynSession {
      persistedAsset.map(withFloatingUpdate(convertPersistedAsset(setFloating, findRoadlink)))
    }
  }

  def getPersistedAssetsByIds(ids: Set[Long]): Seq[PersistedAsset] = {
    withDynSession {
      val idsStr = ids.toSeq.mkString(",")
      val filter = s"where a.asset_type_id = $typeId and a.id in ($idsStr)"
      fetchPointAssets(withFilter(filter))
    }
  }

  def expire(id: Long, username: String): Long = {
    withDynSession {
      Queries.updateAssetModified(id, username).first
      sqlu"update asset set valid_to = sysdate where id = $id".first
    }
  }

  protected def convertPersistedAsset[T](conversion: (PersistedAsset, Boolean) => T,
                                         roadLinkByLinkId: Long => Option[(Int, Seq[Point])])
                                        (persistedStop: PersistedAsset): T = {
    val floating = PointAssetOperations.isFloating(persistedStop, roadLinkByLinkId(persistedStop.linkId))
    conversion(persistedStop, floating)
  }

  protected def withFilter(filter: String)(query: String): String = {
    query + " " + filter
  }

  protected def withMunicipality(municipalityCode: Int)(query: String): String = {
    withFilter(s"where a.asset_type_id = $typeId and a.municipality_code = $municipalityCode")(query)
  }

  protected def withFloatingUpdate[T <: FloatingAsset](toPointAsset: PersistedAsset => T)
                                                      (persistedAsset: PersistedAsset): T = {
    val pointAsset = toPointAsset(persistedAsset)
    if (persistedAsset.floating != pointAsset.floating) updateFloating(pointAsset.id, pointAsset.floating)
    pointAsset
  }

  protected def updateFloating(id: Long, floating: Boolean) = sqlu"""update asset set floating = $floating where id = $id""".execute

  protected def floatingReason(persistedAsset: PersistedAsset, roadLinkOption: Option[VVHRoadlink]) = {
    roadLinkOption match {
      case None => "No road link found with id %d".format(persistedAsset.linkId)
      case Some(roadLink) =>
        if (roadLink.municipalityCode != persistedAsset.municipalityCode) {
          "Road link and asset have differing municipality codes (%d vs %d)".format(roadLink.municipalityCode, persistedAsset.municipalityCode)
        } else {
          val point = Point(persistedAsset.lon, persistedAsset.lat)
          val roadOption = GeometryUtils.calculatePointFromLinearReference(roadLink.geometry, persistedAsset.mValue)
          roadOption match {
            case Some(value) => "Distance to road link is %.3f".format(value.distance2DTo(point))
            case _ => "Road link has no reference point for mValue %.3f".format(persistedAsset.mValue)
          }
        }
    }
  }
}

object PointAssetOperations {
  def calculateBearing(persistedPointAsset: PersistedPointAsset, roadLinkOption: Option[VVHRoadlink]): Option[Int] = {
    roadLinkOption match {
      case None => None
      case Some(roadLink) =>
        Some(calculateBearing(persistedPointAsset, roadLink.geometry))
    }
  }

  def calculateBearing(persistedPointAsset: PersistedPointAsset, geometry: Seq[Point]): Int = {
    calculateBearing(Point(persistedPointAsset.lon, persistedPointAsset.lat), geometry)
  }

  def calculateBearing(point: Point, geometry: Seq[Point]): Int = {
    def direction(p1: Point, p2: Point): Long = {
      val dLon = p2.x - p1.x
      val dLat = p2.y - p1.y
      Math.round(Math.toDegrees(Math.atan2(dLon, dLat)) + 360) % 360
    }
    val closest = GeometryUtils.segmentByMinimumDistance(point, geometry)
    direction(closest._1, closest._2).toInt
  }

  def isFloating(persistedAsset: PersistedPointAsset, roadLink: Option[(Int, Seq[Point])]): Boolean = {
    val logger = LoggerFactory.getLogger(getClass)
    logger.info("Float check: RoadLink = " + roadLink)
    val point = Point(persistedAsset.lon, persistedAsset.lat)
    if (roadLink.nonEmpty) {
      logger.info("Float check: municipality %d <=> %d".format(roadLink.get._1, persistedAsset.municipalityCode))
      val refPoint = GeometryUtils.calculatePointFromLinearReference(roadLink.get._2, persistedAsset.mValue)
      if (refPoint.nonEmpty)
        logger.info("Float check: distance (%.3f,%.3f) <-> (%.3f,%.3f) = %.3f ".format(point.x, point.y, refPoint.get.x, refPoint.get.y, point.distance2DTo(refPoint.get)))
      else
        logger.info("Float check: Reference Point is empty!")
    }
    roadLink match {
      case None => true
      case Some((municipalityCode, geometry)) => municipalityCode != persistedAsset.municipalityCode ||
        !coordinatesWithinThreshold(Some(point), GeometryUtils.calculatePointFromLinearReference(geometry, persistedAsset.mValue))
    }
  }

  private val FLOAT_THRESHOLD_IN_METERS = 3

  def coordinatesWithinThreshold(pt1: Option[Point], pt2: Option[Point]): Boolean = {
    (pt1, pt2) match {
      case (Some(point1), Some(point2)) => point1.distance2DTo(point2) <= FLOAT_THRESHOLD_IN_METERS
      case _ => false
    }
  }
}
