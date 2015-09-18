package fi.liikennevirasto.digiroad2.linearasset

import fi.liikennevirasto.digiroad2.asset.{SideCode, AdministrativeClass}

trait LinearAssetFiller {
  case class AdjustedSpeedLimitSegment(speedLimitSegment: SpeedLimit, adjustedMValue: Option[Double])
  case class MValueAdjustment(assetId: Long, mmlId: Long, startMeasure: Double, endMeasure: Double)
  case class SideCodeAdjustment(assetId: Long, sideCode: SideCode)
  case class UnknownLimit(mmlId: Long, municipalityCode: Int, administrativeClass: AdministrativeClass)
  case class ChangeSet(droppedAssetIds: Set[Long],
                       adjustedMValues: Seq[MValueAdjustment],
                       adjustedSideCodes: Seq[SideCodeAdjustment],
                       generatedUnknownLimits: Seq[UnknownLimit])
}
