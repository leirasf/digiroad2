package fi.liikennevirasto.digiroad2


import fi.liikennevirasto.digiroad2.asset.{UnknownLinkType, Municipality, TrafficDirection, SideCode}
import fi.liikennevirasto.digiroad2.linearasset.{NumericValue, SpeedLimit}
import fi.liikennevirasto.viite.RoadAddressService
import fi.liikennevirasto.viite.dao.CalibrationPoint
import fi.liikennevirasto.viite.model.RoadAddressLink
import org.json4s.{DefaultFormats, Formats}
import org.mockito.Mockito._
import org.scalatest.mock.MockitoSugar
import org.scalatest.{Tag, BeforeAndAfter, FunSuite}
import org.scalatra.test.scalatest.ScalatraSuite
import org.apache.commons.codec.binary.Base64


class ViiteIntegrationApiSpec extends FunSuite with ScalatraSuite with BeforeAndAfter{
  protected implicit val jsonFormats: Formats = DefaultFormats

  val mockRoadAddressService = MockitoSugar.mock[RoadAddressService]
  when(mockRoadAddressService.getRoadAddressesLinkByMunicipality(235)).thenReturn(Seq())

  private val integrationApi = new ViiteIntegrationApi(mockRoadAddressService)
  addServlet(integrationApi, "/*")

  def getWithBasicUserAuth[A](uri: String, username: String, password: String)(f: => A): A = {
    val credentials = username + ":" + password
    val encodedCredentials = Base64.encodeBase64URLSafeString(credentials.getBytes)
    val authorizationToken = "Basic " + encodedCredentials + "="
    get(uri, Seq.empty, Map("Authorization" -> authorizationToken))(f)
  }

  before {
    integrationApi.clearCache()
  }
  after {
    integrationApi.clearCache()
  }

  test("Should require correct authentication", Tag("db")) {
    get("/road_address") {
      status should equal(401)
    }
    getWithBasicUserAuth("/road_address", "nonexisting", "incorrect") {
      status should equal(401)
    }
  }

  test("Get road address requires municipality number") {
    getWithBasicUserAuth("/road_address", "kalpa", "kalpa") {
      status should equal(400)
    }
    getWithBasicUserAuth("/road_address?municipality=235", "kalpa", "kalpa") {
      status should equal(200)
    }
  }

  test("encode road adress") {
    val roadAdressLink = RoadAddressLink(0,5171208,Seq(Point(0.0, 0.0, 0.0), Point(1.0, 0.0, 0.5), Point(4.0, 4.0, 1.5)),0.0,Municipality,0,TrafficDirection.UnknownDirection,UnknownLinkType,None,None,Map("linkId" ->5171208, "segmentId" -> 63298 ),5,205,1,0,0,0,1,"2015-01-01","2016-01-01",0.0,0.0,SideCode.Unknown,Some(CalibrationPoint(120,1,2)),None)
    integrationApi.roadAddressLinksToApi(Seq(roadAdressLink)) should be(Seq(Map(
      "muokattu_viimeksi" -> "",
      "geometryWKT" -> "LINESTRING ZM (0.0 0.0 0.0 0.0, 1.0 0.0 0.5 1.0, 4.0 4.0 1.5 6.0)",
      "id" -> 0,
      "road_number" -> 5,
      "road_part_number" -> 205,
      "track_code" -> 1,
      "start_addr_m" -> 0,
      "end_addr_m" -> 1,
      "ely_code" -> 0,
      "road_type" -> "", //TODO do that after the merge of 339
      "discontinuity" -> 0,
      "start_date" ->  "2015-01-01",
      "end_date" ->  "2016-01-01",
      "calibration_points" -> Map("start" ->  Some(Map("link_id" -> 120, "address_m_value" -> 2, "segment_m_value" -> 1)), "end" -> None)
    )))
  }

  test("geometryWKTForLinearAssets provides proper geometry") {
    val (header, returntxt) =
      integrationApi.geometryWKT(Seq(Point(0.0, 0.0, 0.0), Point(1.0, 0.0, 0.5), Point(4.0, 4.0, 1.5)))
    header should be ("geometryWKT")
    returntxt should be ("LINESTRING ZM (0.0 0.0 0.0 0.0, 1.0 0.0 0.5 1.0, 4.0 4.0 1.5 6.0)")
  }
}
