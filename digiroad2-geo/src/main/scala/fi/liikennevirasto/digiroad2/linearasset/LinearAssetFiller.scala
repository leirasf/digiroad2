package fi.liikennevirasto.digiroad2.linearasset

import fi.liikennevirasto.digiroad2.asset.{SideCode}

object LinearAssetFiller {
  case class AdjustedSpeedLimitSegment(speedLimitSegment: SpeedLimit, adjustedMValue: Option[Double])
  case class MValueAdjustment(assetId: Long, linkId: Long, startMeasure: Double, endMeasure: Double)
  case class SideCodeAdjustment(assetId: Long, sideCode: SideCode)
  case class ChangeSet(droppedAssetIds: Set[Long],
                       adjustedMValues: Seq[MValueAdjustment],
                       adjustedSideCodes: Seq[SideCodeAdjustment],
                       expiredAssetIds: Set[Long])
}
