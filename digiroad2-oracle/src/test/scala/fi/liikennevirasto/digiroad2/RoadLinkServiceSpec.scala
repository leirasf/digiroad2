package fi.liikennevirasto.digiroad2

import fi.liikennevirasto.digiroad2.FeatureClass.AllOthers
import fi.liikennevirasto.digiroad2.asset.Asset._
import fi.liikennevirasto.digiroad2.asset._
import fi.liikennevirasto.digiroad2.linearasset.RoadLink
import fi.liikennevirasto.digiroad2.oracle.OracleDatabase
import fi.liikennevirasto.digiroad2.util.VVHSerializer
import org.joda.time.DateTime
import org.mockito.Matchers._
import org.mockito.Mockito._
import org.scalatest.mock.MockitoSugar
import org.scalatest.{BeforeAndAfter, FunSuite, Matchers}
import slick.driver.JdbcDriver.backend.Database.dynamicSession
import slick.jdbc.StaticQuery.interpolation
import slick.jdbc.{StaticQuery => Q}

import scala.concurrent.Promise

class RoadLinkServiceSpec extends FunSuite with Matchers with BeforeAndAfter {

  class TestService(vvhClient: VVHClient, eventBus: DigiroadEventBus = new DummyEventBus, vvhSerializer: VVHSerializer = new DummySerializer) extends RoadLinkService(vvhClient, eventBus, vvhSerializer) {
    override def withDynTransaction[T](f: => T): T = f
    override def withDynSession[T](f: => T): T = f
  }

  private def simulateQuery[T](f: => T): T = {
    val result = f
    sqlu"""delete from temp_id""".execute
    result
  }

  test("Override road link traffic direction with adjusted value") {
    OracleDatabase.withDynTransaction {
      val mockVVHClient = MockitoSugar.mock[VVHClient]
      when(mockVVHClient.fetchVVHRoadlinks(Set(1611447l)))
        .thenReturn(Seq(VVHRoadlink(1611447, 91, Nil, Municipality, TrafficDirection.UnknownDirection, FeatureClass.AllOthers)))
      val service = new TestService(mockVVHClient)
      val roadLinks = service.getRoadLinksFromVVH(Set(1611447l))
      roadLinks.find {
        _.linkId == 1611447
      }.map(_.trafficDirection) should be(Some(TrafficDirection.AgainstDigitizing))
      dynamicSession.rollback()
    }
  }

  test("Include road link functional class with adjusted value") {
    OracleDatabase.withDynTransaction {
      val mockVVHClient = MockitoSugar.mock[VVHClient]
      when(mockVVHClient.fetchVVHRoadlinks(Set(1611447l)))
        .thenReturn(Seq(VVHRoadlink(1611447, 91, Nil, Municipality, TrafficDirection.UnknownDirection, FeatureClass.AllOthers)))
      val service = new TestService(mockVVHClient)
      val roadLinks = service.getRoadLinksFromVVH(Set(1611447l))
      roadLinks.find {_.linkId == 1611447}.map(_.functionalClass) should be(Some(4))
      dynamicSession.rollback()
    }
  }

  test("Adjust link type") {
    OracleDatabase.withDynTransaction {
      val mockVVHClient = MockitoSugar.mock[VVHClient]
      when(mockVVHClient.fetchVVHRoadlink(1l))
        .thenReturn(Some(VVHRoadlink(1l, 91, Nil, Municipality, TrafficDirection.UnknownDirection, FeatureClass.AllOthers)))
      val service = new TestService(mockVVHClient)
      val roadLink = service.updateLinkProperties(1, 5, PedestrianZone, TrafficDirection.BothDirections, Option("testuser"), { _ => })
      roadLink.map(_.linkType) should be(Some(PedestrianZone))
      dynamicSession.rollback()
    }
  }

  test("Provide last edited date from VVH on road link modification date if there are no overrides") {
    OracleDatabase.withDynTransaction {
      val mockVVHClient = MockitoSugar.mock[VVHClient]
      val lastEditedDate = DateTime.now()
      val roadLinks = Seq(VVHRoadlink(1l, 0, Nil, Municipality, TrafficDirection.TowardsDigitizing, AllOthers, Some(lastEditedDate)))
      when(mockVVHClient.fetchVVHRoadlinksF(any[BoundingRectangle], any[Set[Int]])).thenReturn(Promise.successful(roadLinks).future)
      when(mockVVHClient.fetchChangesF(any[BoundingRectangle], any[Set[Int]])).thenReturn(Promise.successful(Nil).future)

      val service = new TestService(mockVVHClient)
      val results = service.getRoadLinksFromVVH(BoundingRectangle(Point(0.0, 0.0), Point(1.0, 1.0)))
      results.head.modifiedAt should be(Some(DateTimePropertyFormat.print(lastEditedDate)))
      dynamicSession.rollback()
    }
  }

  test("Adjust link traffic direction to value that is in VVH") {
    OracleDatabase.withDynTransaction {
      val mockVVHClient = MockitoSugar.mock[VVHClient]
      when(mockVVHClient.fetchVVHRoadlink(1l))
        .thenReturn(Some(VVHRoadlink(1l, 91, Nil, Municipality, TrafficDirection.UnknownDirection, FeatureClass.AllOthers)))
      val service = new TestService(mockVVHClient)
      val roadLink = simulateQuery {
        service.updateLinkProperties(1, 5, PedestrianZone, TrafficDirection.BothDirections, Option("testuser"), { _ => })
      }
      roadLink.map(_.trafficDirection) should be(Some(TrafficDirection.BothDirections))
      val roadLink2 = simulateQuery {
        service.updateLinkProperties(1, 5, PedestrianZone, TrafficDirection.TowardsDigitizing, Option("testuser"), { _ => })
      }
      roadLink2.map(_.trafficDirection) should be(Some(TrafficDirection.TowardsDigitizing))
      dynamicSession.rollback()
    }
  }

  test("Adjust non-existent road link") {
    val mockVVHClient = MockitoSugar.mock[VVHClient]
    when(mockVVHClient.fetchVVHRoadlink(1l)).thenReturn(None)
    val service = new RoadLinkService(mockVVHClient, new DummyEventBus, new DummySerializer)
    val roadLink = service.updateLinkProperties(1, 5, PedestrianZone, TrafficDirection.BothDirections, Option("testuser"), { _ => })
    roadLink.map(_.linkType) should be(None)
  }

  test("Validate access rights to municipality") {
    OracleDatabase.withDynTransaction {
      val mockVVHClient = MockitoSugar.mock[VVHClient]
      when(mockVVHClient.fetchVVHRoadlink(1l))
        .thenReturn(Some(VVHRoadlink(1l, 91, Nil, Municipality, TrafficDirection.UnknownDirection, FeatureClass.AllOthers)))
      val service = new TestService(mockVVHClient)
      var validatedCode = 0
      service.updateLinkProperties(1, 5, PedestrianZone, TrafficDirection.BothDirections, Option("testuser"), { municipalityCode =>
        validatedCode = municipalityCode
      })
      validatedCode should be(91)
      dynamicSession.rollback()
    }
  }


  test("Autogenerate properties for tractor road and drive path") {
    OracleDatabase.withDynTransaction {
      val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
      val mockVVHClient = MockitoSugar.mock[VVHClient]
      val service = new TestService(mockVVHClient)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)
      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set()))
        .thenReturn(Promise.successful(List(
        VVHRoadlink(123l, 91, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.DrivePath),
        VVHRoadlink(456l, 91, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.TractorRoad),
        VVHRoadlink(789l, 91, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers),
        VVHRoadlink(111l, 91, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.CycleOrPedestrianPath))).future)

      sqlu"""delete from incomplete_link where municipality_code = 91""".execute
      sqlu"""insert into incomplete_link(id, link_id, municipality_code) values(3123123123, 456, 91)""".execute
      val roadLinks = service.getRoadLinksFromVVH(boundingBox)

      roadLinks.find(_.linkId == 123).get.functionalClass should be(6)
      roadLinks.find(_.linkId == 123).get.linkType should be(SingleCarriageway)

      roadLinks.find(_.linkId == 456).get.functionalClass should be(7)
      roadLinks.find(_.linkId == 456).get.linkType should be(TractorRoad)

      roadLinks.find(_.linkId == 789).get.functionalClass should be(FunctionalClass.Unknown)
      roadLinks.find(_.linkId == 789).get.linkType should be(UnknownLinkType)

      roadLinks.find(_.linkId == 111).get.functionalClass should be(8)
      roadLinks.find(_.linkId == 111).get.linkType should be(CycleOrPedestrianPath)

      dynamicSession.rollback()
    }
  }

  test("Changes should cause event") {
    OracleDatabase.withDynTransaction {
      val mockEventBus = MockitoSugar.mock[DigiroadEventBus]
      val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
      val mockVVHClient = MockitoSugar.mock[VVHClient]
      val vvhRoadLinks = List(
        VVHRoadlink(123l, 91, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.DrivePath),
        VVHRoadlink(789l, 91, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers))
      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(vvhRoadLinks).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)

      val service = new TestService(mockVVHClient, mockEventBus)
      val result = service.getRoadLinksFromVVH(boundingBox)
      val exactModifiedAtValue = result.head.modifiedAt
      val roadLink: List[RoadLink] = List(RoadLink(123, List(), 0.0, Municipality, 6, TrafficDirection.TowardsDigitizing, SingleCarriageway, exactModifiedAtValue, Some("automatic_generation")))
      val changeSet: RoadLinkChangeSet = RoadLinkChangeSet(roadLink, List(IncompleteLink(789,91,Municipality)))

      verify(mockEventBus).publish(
        org.mockito.Matchers.eq("linkProperties:changed"),
        org.mockito.Matchers.eq(changeSet))

      dynamicSession.rollback()
    }
  }

  test("Remove road link from incomplete link list once functional class and link type are specified") {
    OracleDatabase.withDynTransaction {
      val mockVVHClient = MockitoSugar.mock[VVHClient]
      val roadLink = VVHRoadlink(1l, 91, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers)
      when(mockVVHClient.fetchVVHRoadlink(1l)).thenReturn(Some(roadLink))
      val service = new TestService(mockVVHClient)

      sqlu"""insert into incomplete_link (id, link_id, municipality_code, administrative_class) values (43241231233, 1, 91, 1)""".execute

      simulateQuery { service.updateLinkProperties(1, FunctionalClass.Unknown, Freeway, TrafficDirection.BothDirections, Option("test"), _ => ()) }
      simulateQuery { service.updateLinkProperties(1, 4, UnknownLinkType, TrafficDirection.BothDirections, Option("test"), _ => ()) }

      val incompleteLinks = service.getIncompleteLinks(Some(Set(91)))
      incompleteLinks should be(empty)

      dynamicSession.rollback()
    }
  }

  test("Should map link properties of old link to new link when one old link maps to one new link") {
    val oldLinkId = 1l
    val newLinkId = 2l
    val changeInfo = ChangeInfo(Some(oldLinkId), Some(newLinkId), 123l, 5, Some(0), Some(1), Some(0), Some(1), 144000000)
    val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
    val oldRoadLink = VVHRoadlink(oldLinkId, 235, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))
    val newRoadLink = VVHRoadlink(newLinkId, 235, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))

    val mockVVHClient = MockitoSugar.mock[VVHClient]
    val service = new TestService(mockVVHClient)

    OracleDatabase.withDynTransaction {
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (1, $oldLinkId, 3, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (2, $oldLinkId, ${Freeway.value}, 'test' )""".execute
      sqlu"""insert into traffic_direction (id, link_id, traffic_direction, modified_by) values (3, $oldLinkId, ${TrafficDirection.BothDirections.value}, 'test' )""".execute

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(oldRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)
      val before = service.getRoadLinksFromVVH(boundingBox)
      before.head.functionalClass should be(3)
      before.head.linkType should be(Freeway)
      before.head.trafficDirection should be(TrafficDirection.BothDirections)

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(newRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Seq(changeInfo)).future)
      val after = service.getRoadLinksFromVVH(boundingBox)
      after.head.functionalClass should be(3)
      after.head.linkType should be(Freeway)
      after.head.trafficDirection should be(TrafficDirection.BothDirections)

      dynamicSession.rollback()
    }
  }

  test("Shoul map link properties of old link to new link when multiple old links map to new link and all have same values") {
    val oldLinkId1 = 1l
    val oldLinkId2 = 2l
    val newLinkId = 3l
    val changeInfo = Seq(ChangeInfo(Some(oldLinkId1), Some(newLinkId), 123l, 5, Some(0), Some(1), Some(0), Some(1), 144000000), ChangeInfo(Some(oldLinkId2), Some(newLinkId), 345l, 5, Some(0), Some(1), Some(0), Some(1), 144000000))
    val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
    val oldRoadLinks = Seq(VVHRoadlink(oldLinkId1, 235, Nil, Municipality, TrafficDirection.AgainstDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235))),
      VVHRoadlink(oldLinkId2, 235, Nil, Municipality, TrafficDirection.AgainstDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235))))
    val newRoadLink = VVHRoadlink(newLinkId, 235, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))

    val mockVVHClient = MockitoSugar.mock[VVHClient]
    val service = new TestService(mockVVHClient)

    OracleDatabase.withDynTransaction {
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (1, $oldLinkId1, 3, 'test' )""".execute
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (2, $oldLinkId2, 3, 'test' )""".execute
      sqlu"""insert into traffic_direction (id, link_id, traffic_direction, modified_by) values (3, $oldLinkId1, ${TrafficDirection.TowardsDigitizing.value}, 'test' )""".execute
      sqlu"""insert into traffic_direction (id, link_id, traffic_direction, modified_by) values (4, $oldLinkId2, ${TrafficDirection.TowardsDigitizing.value}, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (5, $oldLinkId1, ${Freeway.value}, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (6, $oldLinkId2, ${Freeway.value}, 'test' )""".execute

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(oldRoadLinks).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)
      val before = service.getRoadLinksFromVVH(boundingBox)
      before.foreach(_.functionalClass should be(3))
      before.foreach(_.linkType should be(Freeway))
      before.foreach(_.trafficDirection should be(TrafficDirection.TowardsDigitizing))

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(newRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(changeInfo).future)
      val after = service.getRoadLinksFromVVH(boundingBox)
      after.head.functionalClass should be(3)
      after.head.linkType should be(Freeway)
      after.head.trafficDirection should be(TrafficDirection.TowardsDigitizing)


      dynamicSession.rollback()
    }
  }

  test("""Functional class and link type should be unknown
         and traffic direction same as for the new VVH link
         when multiple old links map to new link but have different properties values""") {
    val oldLinkId1 = 1l
    val oldLinkId2 = 2l
    val newLinkId = 3l
    val changeInfo = Seq(ChangeInfo(Some(oldLinkId1), Some(newLinkId), 123l, 5, Some(0), Some(1), Some(0), Some(1), 144000000), ChangeInfo(Some(oldLinkId2), Some(newLinkId), 345l, 5, Some(0), Some(1), Some(0), Some(1), 144000000))
    val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
    val oldRoadLinks = Seq(
      VVHRoadlink(oldLinkId1, 235, Nil, Municipality, TrafficDirection.AgainstDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235))),
      VVHRoadlink(oldLinkId2, 235, Nil, Municipality, TrafficDirection.AgainstDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235))))
    val newRoadLink = VVHRoadlink(newLinkId, 235, Nil, Municipality, TrafficDirection.BothDirections, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))

    val mockVVHClient = MockitoSugar.mock[VVHClient]
    val service = new TestService(mockVVHClient)

    OracleDatabase.withDynTransaction {
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (1, $oldLinkId1, 3, 'test' )""".execute
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (2, $oldLinkId2, 2, 'test' )""".execute
      sqlu"""insert into traffic_direction (id, link_id, traffic_direction, modified_by) values (3, $oldLinkId1, ${TrafficDirection.BothDirections.value}, 'test' )""".execute
      sqlu"""insert into traffic_direction (id, link_id, traffic_direction, modified_by) values (4, $oldLinkId2, ${TrafficDirection.TowardsDigitizing.value}, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (5, $oldLinkId1, ${Freeway.value}, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (6, $oldLinkId2, ${Motorway.value}, 'test' )""".execute


      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(oldRoadLinks).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)
      val before = service.getRoadLinksFromVVH(boundingBox)
      before.length should be(2)

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(newRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(changeInfo).future)
      val after = service.getRoadLinksFromVVH(boundingBox)
      after.head.functionalClass should be(FunctionalClass.Unknown)
      after.head.linkType should be(UnknownLinkType)
      after.head.trafficDirection should be(TrafficDirection.BothDirections)

      dynamicSession.rollback()
    }
  }

  test("""Traffic direction should be received from VVH if it wasn't overridden in OTH""") {
    val oldLinkId1 = 1l
    val oldLinkId2 = 2l
    val newLinkId = 3l
    val changeInfo = Seq(ChangeInfo(Some(oldLinkId1), Some(newLinkId), 123l, 5, Some(0), Some(1), Some(0), Some(1), 144000000), ChangeInfo(Some(oldLinkId2), Some(newLinkId), 345l, 5, Some(0), Some(1), Some(0), Some(1), 144000000))
    val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
    val oldRoadLinks = Seq(
      VVHRoadlink(oldLinkId1, 235, Nil, Municipality, TrafficDirection.AgainstDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235))),
      VVHRoadlink(oldLinkId2, 235, Nil, Municipality, TrafficDirection.AgainstDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235))))
    val newRoadLink = VVHRoadlink(newLinkId, 235, Nil, Municipality, TrafficDirection.BothDirections, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))

    val mockVVHClient = MockitoSugar.mock[VVHClient]
    val service = new TestService(mockVVHClient)

    OracleDatabase.withDynTransaction {
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (1, $oldLinkId1, 3, 'test' )""".execute
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (2, $oldLinkId2, 3, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (5, $oldLinkId1, ${Freeway.value}, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (6, $oldLinkId2, ${Freeway.value}, 'test' )""".execute


      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(oldRoadLinks).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)
      val before = service.getRoadLinksFromVVH(boundingBox)
      before.length should be(2)

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(newRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(changeInfo).future)
      val after = service.getRoadLinksFromVVH(boundingBox)
      after.head.functionalClass should be(3)
      after.head.linkType should be(Freeway)
      after.head.trafficDirection should be(TrafficDirection.BothDirections)

      dynamicSession.rollback()
    }
  }

  test("Should map link properties of old link to two new links when old link maps multiple new links in change info table") {
    val oldLinkId = 1l
    val newLinkId1 = 2l
    val newLinkId2 = 3l
    val changeInfo = Seq(ChangeInfo(Some(oldLinkId), Some(newLinkId1), 123l, 5, Some(0), Some(1), Some(0), Some(1), 144000000), ChangeInfo(Some(oldLinkId), Some(newLinkId2), 345l, 5, Some(0), Some(1), Some(0), Some(1), 144000000))
    val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
    val oldRoadLink = VVHRoadlink(oldLinkId, 235, Nil, Municipality, TrafficDirection.AgainstDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))
    val newRoadLinks = Seq(
      VVHRoadlink(newLinkId1, 235, Nil, Municipality, TrafficDirection.BothDirections, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235))),
      VVHRoadlink(newLinkId2, 235, Nil, Municipality, TrafficDirection.BothDirections, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235))))

    val mockVVHClient = MockitoSugar.mock[VVHClient]
    val service = new TestService(mockVVHClient)

    OracleDatabase.withDynTransaction {
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (1, $oldLinkId, 3, 'test' )""".execute
      sqlu"""insert into traffic_direction (id, link_id, traffic_direction, modified_by) values (3, $oldLinkId, ${TrafficDirection.TowardsDigitizing.value}, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (5, $oldLinkId, ${SlipRoad.value}, 'test' )""".execute

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(oldRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)
      val before = service.getRoadLinksFromVVH(boundingBox)
      before.foreach(_.functionalClass should be(3))
      before.foreach(_.linkType should be(SlipRoad))
      before.foreach(_.trafficDirection should be(TrafficDirection.TowardsDigitizing))

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(newRoadLinks).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(changeInfo).future)
      val after = service.getRoadLinksFromVVH(boundingBox)
      after.length should be(2)
      after.foreach { link =>
        link.functionalClass should be(3)
        link.linkType should be(SlipRoad)
        link.trafficDirection should be(TrafficDirection.TowardsDigitizing)
      }

      dynamicSession.rollback()
    }
  }

  test("Should map link properties of old link to new link when one old link maps to one new link, old link has functional class but no link type") {
    val oldLinkId = 1l
    val newLinkId = 2l
    val changeInfo = ChangeInfo(Some(oldLinkId), Some(newLinkId), 123l, 5, Some(0), Some(1), Some(0), Some(1), 144000000)
    val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
    val oldRoadLink = VVHRoadlink(oldLinkId, 235, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))
    val newRoadLink = VVHRoadlink(newLinkId, 235, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))

    val mockVVHClient = MockitoSugar.mock[VVHClient]
    val service = new TestService(mockVVHClient)

    OracleDatabase.withDynTransaction {
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (1, $oldLinkId, 3, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (2, $oldLinkId, ${Freeway.value}, 'test' )""".execute
      sqlu"""insert into traffic_direction (id, link_id, traffic_direction, modified_by) values (3, $oldLinkId, ${TrafficDirection.BothDirections.value}, 'test' )""".execute

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(oldRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)
      val before = service.getRoadLinksFromVVH(boundingBox)
      before.head.functionalClass should be(3)
      before.head.linkType should be(Freeway)
      before.head.trafficDirection should be(TrafficDirection.BothDirections)

      sqlu"""delete from link_type where id=2""".execute

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(newRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Seq(changeInfo)).future)
      val after = service.getRoadLinksFromVVH(boundingBox)
      after.head.functionalClass should be(3)
      after.head.linkType should be(UnknownLinkType)
      after.head.trafficDirection should be(TrafficDirection.BothDirections)

      dynamicSession.rollback()
    }
  }

  test(
    """Should map just old link type (not functional class) to new link
       when one old link maps to one new link
       and new link has functional class but no link type
       and old link has both functional class and link type""".stripMargin) {
    val oldLinkId = 1l
    val newLinkId = 2l
    val changeInfo = ChangeInfo(Some(oldLinkId), Some(newLinkId), 123l, 5, Some(0), Some(1), Some(0), Some(1), 144000000)
    val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
    val oldRoadLink = VVHRoadlink(oldLinkId, 235, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))
    val newRoadLink = VVHRoadlink(newLinkId, 235, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))

    val mockVVHClient = MockitoSugar.mock[VVHClient]
    val service = new TestService(mockVVHClient)

    OracleDatabase.withDynTransaction {
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (1, $oldLinkId, 3, 'test' )""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by) values (3, $oldLinkId, ${Freeway.value}, 'test' )""".execute
      sqlu"""insert into traffic_direction (id, link_id, traffic_direction, modified_by) values (4, $oldLinkId, ${TrafficDirection.BothDirections.value}, 'test' )""".execute

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(oldRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)
      val before = service.getRoadLinksFromVVH(boundingBox)
      before.head.functionalClass should be(3)
      before.head.linkType should be(Freeway)
      before.head.trafficDirection should be(TrafficDirection.BothDirections)

      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by) values (2, $newLinkId, 6, 'test' )""".execute

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(newRoadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Seq(changeInfo)).future)
      val after = service.getRoadLinksFromVVH(boundingBox)
      after.head.functionalClass should be(6)
      after.head.linkType should be(Freeway)
      after.head.trafficDirection should be(TrafficDirection.BothDirections)

      dynamicSession.rollback()
    }
  }

  test("Should take the latest time stamp (from VVH road link or from link properties in db) to show in UI") {

    val linkId = 1l
    val boundingBox = BoundingRectangle(Point(123, 345), Point(567, 678))
    val vvhModifiedDate = 1455274504000l
    val roadLink = VVHRoadlink(linkId, 235, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers, Option(new DateTime(vvhModifiedDate.toLong)), attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))

    val mockVVHClient = MockitoSugar.mock[VVHClient]
    val service = new TestService(mockVVHClient)

    OracleDatabase.withDynTransaction {
      sqlu"""insert into functional_class (id, link_id, functional_class, modified_by, modified_date) values (1, $linkId, 3, 'test', TO_TIMESTAMP('2014-02-10 10:03:51.047483', 'YYYY-MM-DD HH24:MI:SS.FF6'))""".execute
      sqlu"""insert into traffic_direction (id, link_id, traffic_direction, modified_by, modified_date) values (2, $linkId, ${TrafficDirection.TowardsDigitizing.value}, 'test', TO_TIMESTAMP('2014-02-10 10:03:51.047483', 'YYYY-MM-DD HH24:MI:SS.FF6'))""".execute
      sqlu"""insert into link_type (id, link_id, link_type, modified_by, modified_date) values (5, $linkId, ${Freeway.value}, 'test', TO_TIMESTAMP('2015-03-10 10:03:51.047483', 'YYYY-MM-DD HH24:MI:SS.FF6'))""".execute

      when(mockVVHClient.fetchVVHRoadlinksF(boundingBox, Set())).thenReturn(Promise.successful(Seq(roadLink)).future)
      when(mockVVHClient.fetchChangesF(boundingBox, Set())).thenReturn(Promise.successful(Nil).future)
      val roadLinkAfterDateComparison = service.getRoadLinksFromVVH(boundingBox).head

      roadLinkAfterDateComparison.modifiedAt.get should be ("12.02.2016 12:55:04")
      roadLinkAfterDateComparison.modifiedBy.get should be ("vvh_modified")

      dynamicSession.rollback()
    }
  }

  test("Check the correct return of a ViiteRoadLink By Municipality") {
    val municipalityId = 235
    val linkId = 2l
    val roadLink = VVHRoadlink(linkId, municipalityId, Nil, Municipality, TrafficDirection.TowardsDigitizing, FeatureClass.AllOthers, attributes = Map("MUNICIPALITYCODE" -> BigInt(235)))

    val mockVVHClient = MockitoSugar.mock[VVHClient]
    val service = new TestService(mockVVHClient)

    OracleDatabase.withDynTransaction {
      when(mockVVHClient.fetchByMunicipality(municipalityId)).thenReturn(Seq(roadLink))

      val viiteRoadLinks = service.getViiteRoadLinksFromVVHByMunicipality(municipalityId)

      viiteRoadLinks.length > 0 should be (true)
      viiteRoadLinks.head.isInstanceOf[RoadLink] should be (true)
      viiteRoadLinks.head.linkId should be(linkId)
      viiteRoadLinks.head.municipalityCode should be (municipalityId)

    }
  }

}
