import fi.liikennevirasto.digiroad2._
import fi.liikennevirasto.digiroad2.authentication.SessionApi
import fi.liikennevirasto.digiroad2.dataimport.DataImportApi
import fi.liikennevirasto.digiroad2.user.UserConfigurationApi
import org.scalatra._
import javax.servlet.ServletContext

class ScalatraBootstrap extends LifeCycle {
  override def init(context: ServletContext) {
    context.mount(new Digiroad2Api(Digiroad2Context.roadLinkService,
      Digiroad2Context.speedLimitProvider,
      Digiroad2Context.massTransitStopService,
      Digiroad2Context.numericalLimitService
    ), "/api/*")
    context.mount(new SessionApi, "/api/auth/*")
    context.mount(new UserConfigurationApi, "/api/userconfig/*")
    context.mount(new PingApi, "/api/ping/*")
    context.mount(new DataImportApi, "/api/import/*")
    context.mount(new IntegrationApi, "/api/integration/*")
  }
}
