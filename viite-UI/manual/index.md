Viite-sovelluksen k&auml;ytt&ouml;ohje
======================================================

__Huom! Suosittelemme Firefoxia tai Chromea, kun sovelluksella yll&auml;pidet&auml;&auml;n Digiroad-tietoja.__

__Huom! K&auml;ytt&ouml;ohjeen kuvia voi klikata isommaksi, jolloin tekstit erottuvat paremmin.__

1. Miten p&auml;&auml;st&auml; alkuun?
-----------------------

Viite-sovelluksen k&auml;ytt&ouml;&auml; varten tarvitaan Liikenneviraston tunnukset (A-, U-, LX-, K- tai L-alkuinen). Mik&auml;li sinulla ei ole tunnuksia, pyyd&auml; ne yhteyshenkil&ouml;lt&auml;si Liikennevirastosta.

Kaikilla Liikenneviraston tunnuksilla on p&auml;&auml;sy Viite-sovellukseen.

Viite-sovellukseen kirjaudutaan osoitteessa: <a href=https://devtest.liikennevirasto.fi/viite/ target="_blank">https://devtest.liikennevirasto.fi/viite/. </a>

![Kirjautuminen Viite-sovellukseen.](k1.JPG)

_Kirjautuminen Viite-sovellukseen._

Kirjautumisen j&auml;lkeen avautuu karttak&auml;ytt&ouml;liittym&auml;ss&auml; katselutila.

![N&auml;kym&auml; kirjautumisen j&auml;lkeen.](k2.JPG)

_Karttan&auml;kym&auml; kirjautumisen j&auml;lkeen._

Oikeudet on rajattu maantieteellisesti sek&auml; k&auml;ytt&auml;j&auml;n roolin mukaan.

- Ilman erikseen annettuja oikeuksia Liikenneviraston tunnuksilla p&auml;&auml;see katselemaan kaikkia aineistoja.
- Sovelluksen k&auml;ytt&auml;j&auml;ll&auml; on oikeudet h&auml;nelle m&auml;&auml;riteltyjen Elyjen maantieteellisten kuntarajojen sis&auml;puolella oleviin tieosoitteisiin
- Joillekin k&auml;ytt&auml;jille on voitu antaa oikeudet koko Suomen alueelle

Jos kirjautumisen j&auml;lkeen ei avaudu karttak&auml;ytt&ouml;liittym&auml;n katselutilaa, ei kyseisell&auml; tunnuksella ole p&auml;&auml;sy&auml; Liikenneviraston extranettiin. T&auml;ll&ouml;in tulee ottaa yhteytt&auml; Liikennevirastossa omaan yhteyshenkil&ouml;&ouml;n.

1.1 Mist&auml; saada opastusta?
--------------------------

Viite-sovelluksen k&auml;yt&ouml;ss&auml; avustaa vuoden 2016 loppuun asti Emmi Sallinen, emmi.sallinen@karttakeskus.fi

####Ongelmatilanteet####

Sovelluksen toimiessa virheellisesti (esim. kaikki aineistot eiv&auml;t lataudu oikein) toimi seuraavasti:

- Lataa sivu uudelleen n&auml;pp&auml;imist&ouml;n F5-painikkeella.
- Tarkista, ett&auml; selaimestasi on k&auml;yt&ouml;ss&auml; ajan tasalla oleva versio ja selaimesi on Mozilla Firefox tai Chrome
- Jos edell&auml; olevat eiv&auml;t korjaa ongelmaa, ota yhteytt&auml; emmi.sallinen@karttakeskus.fi


2. Tiedon rakentuminen Viite-sovelluksessa
--------------------------

Viite-sovellus on karttasovellus, jossa tieosoiteverkko piirret&auml;&auml;n Maanmittauslaitoksen tarjoaman tielinkki-aineiston p&auml;&auml;lle. Tielinkki on tien, kadun, kevyen liikenteen v&auml;yl&auml;n tai lauttayhteyden keskilinjageometrian pienin yksikk&ouml;. Tieosoiteverkko piirtyy geometrian p&auml;&auml;lle tieosoitesegmenttein&auml; _lineaarisen referoinnin_ avulla. 

Tielinkki on Viite-sovelluksen lineaarinen viitekehys, eli sen geometriaan sidotaan tieosoitesegmentit. Kukin tieosoitesegmentti tiet&auml;&auml; mille tielinkille se kuuluu (tielinkin ID) sek&auml; kohdan, josta se alkaa ja loppuu kyseisell&auml; tielinkill&auml;. Tieosoitesegmentit ovat siten tielinkin mittaisia tai niit&auml; lyhyempi&auml; tieosoitteen osuuksia.

Kullakin tieosoitesegmentill&auml; on lis&auml;ksi tiettyj&auml; sille annettuja ominaisuustietoja, kuten tienumero, tieosanumero ja ajoratakoodi. Tieosoitesegmenttien ominaisuustiedoista on kerrottu tarkemmin kohdassa "Tieosoitteen ominaisuustiedot".

![Kohteita](k9.JPG)

_Tieosoitesegmenttej&auml; (1) ja muita tielinkkej&auml; (2) Viitteen karttaikunnassa._

Tieosoitesegmentit piirret&auml;&auml;n Viite-sovelluksessa kartalle erilaisin v&auml;rein (kts. kohta 4. Tieosoiteverkon katselu). Muut tielinkit, jotka eiv&auml;t kuulu tieosoiteverkkoon, piirret&auml;&auml;n kartalle harmaalla. N&auml;it&auml; ovat esimerkiksi tieosoitteettomat kuntien omistamat tiet, ajopolut, ajotiet jne. pienemm&auml;t tieosuudet.

Palautteet geometrian eli tielinkkien virheist&auml; voi laittaa Maanmittauslaitokselle, maasto@maanmittauslaitos.fi. Mukaan selvitys virheest&auml; ja sen sijainnista (kuvakaappaus tms.).

3. Karttan&auml;kym&auml;n muokkaus
--------------------------

![Karttan&auml;kym&auml;n muokkaus](k3.JPG)

_Karttan&auml;kym&auml;._

####Kartan liikutus####

Karttaa liikutetaan raahaamalla.

####Mittakaavataso####

Kartan mittakaavatasoa muutetaan joko hiiren rullalla, tuplaklikkaamalla, Shift+piirto (alue) tai mittakaavapainikkeista (1). Mittakaavapainikkeita k&auml;ytt&auml;m&auml;ll&auml; kartan keskitys s&auml;ilyy. Hiiren rullalla, tuplaklikkaamalla tai Shift+piirto (alue) kartan keskitys siirtyy kursorin kohtaan.  K&auml;yt&ouml;ss&auml; oleva mittakaavataso n&auml;kyy kartan oikeassa alakulmassa (2).

####Kohdistin####

Kohdistin (3) kertoo kartan keskipisteen. Kohdistimen koordinaatit n&auml;kyv&auml;t karttaikkunan oikeassa alakulmassa(4). Kun kartaa liikuttaa eli keskipiste muuttuu, p&auml;ivittyv&auml;t koordinaatit. Oikean alakulman valinnan (5) avulla kohdistimen saa my&ouml;s halutessaan piilotettua kartalta.

####Merkitse piste kartalla####

Merkitse-painike (6) merkitsee sinisen pisteen kartan keskipisteeseen. Merkki poistuu vain, kun merkit&auml;&auml;n uusi piste kartalta.

####Taustakartat####

Taustakartaksi voi valita vasemman alakulman painikkeista maastokartan, ortokuvat tai taustakarttasarjan. K&auml;yt&ouml;ss&auml; on my&ouml;s harmaas&auml;vykartta (t&auml;m&auml;n hetken versio ei kovin k&auml;ytt&ouml;kelpoinen).

####Hakukentt&auml;####

K&auml;ytt&ouml;liittym&auml;ss&auml; on hakukentt&auml; (8), jossa voi hakea koordinaateilla ja katuosoitteella tai tieosoitteella. Haku suoritetaan kirjoittamalla hakuehto hakukentt&auml;&auml;n ja klikkaamalla Hae. Hakutulos tulee listaan hakukent&auml;n alle. Hakutuloslistassa ylimp&auml;n&auml; on maantieteellisesti kartan nykyist&auml; keskipistett&auml; l&auml;himp&auml;n&auml; oleva kohde. Mik&auml;li hakutuloksia on vain yksi, keskittyy kartta automaattisesti haettuun kohteeseen. Jos hakutuloksia on useampi kuin yksi, t&auml;ytyy listalta valita tulos, jolloin kartta keskittyy siihen. Tyhjenn&auml; tulokset -painike tyhjent&auml;&auml; hakutuloslistan.

Koordinaateilla haku: Koordinaatit sy&ouml;tet&auml;&auml;n muodossa "pohjoinen (7 merkki&auml;), it&auml; (6 merkki&auml;)". Koordinaatit tulee olla ETRS89-TM35FIN -koordinaattij&auml;rjestelm&auml;ss&auml;. Esim. 6975061, 535628.

Katuosoitteella haku: Katuosoitteesta hakukentt&auml;&auml;n voi sy&ouml;tt&auml;&auml; koko ositteen tai sen osan. Esim. "Mannerheimintie" tai "Mannerheimintie 10, Helsinki".

Tieosoitteella haku: Tieosoitteesta hakukentt&auml;&auml;n voi sy&ouml;tt&auml;&auml; koko osoitteen tai osan siit&auml;. Esim. 2 tai 2 1 150. (Varsinainen tieosoitehaku tieosoitteiden yll&auml;pidon tarpeisiin toteutetaan my&ouml;hemmin)


4. Tieosoiteverkon katselu
--------------------------

Tieosoiteverkko tulee n&auml;kyviin, kun zoomaa tasolle, jossa mittakaavajanassa on 2 km. T&auml;st&auml; tasosta ja sit&auml; l&auml;hemp&auml;&auml; piirret&auml;&auml;n kartalle valtatiet, kantatiet, seututiet, yhdystiet ja numeroidut kadut. Kun zoomaa tasolle, jossa mittakaavajanassa on suurempi 100 metri&auml; (100 metrin mittakaavajanoja on kaksi kappaletta), tulevat n&auml;kyviin kaikki tieverkon kohteet.

![Mittakaavajanassa 2km](k4.JPG)

_Mittakaavajanassa 2 km._

![Mittakaavajanassa 100 m](k5.JPG)

_Mittakaavajanassa 100 m._

Tieosoiteverkko on v&auml;rikoodattu tienumeroiden mukaan. Vasemman yl&auml;kulman selitteess&auml; on kerrottu kunkin v&auml;rikoodin tienumerot. Lis&auml;ksi kartalle piirtyv&auml;t kalibrointipisteet, eli ne kohdat, joissa vaihtuu tieosa tai ajoratakoodi.

4.1 Kohteiden valinta
--------------------------
Kohteita voi valita klikkaamalla kartalta. Klikkaamalla kerran, sovellus valitsee kartalta ruudulla n&auml;kyv&auml;n osuuden kyseisest&auml; tieosasta, eli osuuden jolla on sama tienumero, tieosanumero ja ajoratakoodi. Valittu tieosa korostuu kartalla (1), ja sen tiedot tulevat n&auml;kyviin karttaikkunan oikeaan laitaan ominaisuustieton&auml;kym&auml;&auml;n (2).

![Tieosan valinta](k6.JPG)

_Tieosan valinta._

Tuplaklikkaus valitsee yhden tieosoitesegmentin. Tieosoitesegmentti on tielinkin mittainen tai sit&auml; lyhyempi osuus tieosoitetta. Valittu tieosoitesegmentti korostuu kartalla (3), ja sen tiedot tulevat n&auml;kyviin karttaikkunan oikeaan laitaan ominaisuustieton&auml;kym&auml;&auml;n (4).

![Tieosoitesegmentin valinta](k7.JPG)

_Tieosoitesegmentin valinta._


##Tieosoitteen ominaisuustiedot##

Tieosoitteilla on seuraavat ominaisuustiedot:

|Ominaisuustieto|Kuvaus|Sovellus generoi|
|---------------|------|----------------|
|Segmentin ID|Segmentin yksil&ouml;iv&auml; ID, n&auml;kyy kun tieosoitteen valitsee tuplaklikkaamallaID|X|
|Muokattu viimeksi*|Muokkaajan k&auml;ytt&auml;j&auml;tunnus ja tiedon muokkaushetki.|X|
|Linkkien lukum&auml;&auml;r&auml;|Niiden tielinkkien lukum&auml;&auml;r&auml;, joihin valinta  kohdistuu.|X|
|Tienumero|Tieosoiteverkon mukainen tienumero. L&auml;ht&ouml;aineistona Tierekisterin tieosoitteet vuonna 2016.||
|Tieosanumero|Tieosoiteverkon mukainen tieosanumero. L&auml;ht&ouml;aineistona Tierekisterin tieosoitteet vuonna 2016.||
|Ajorata|Tieosoiteverkon mukainen ajoratakoodi. L&auml;ht&ouml;aineistona Tierekisterin tieosoitteet vuonna 2016.||
|Alkuet&auml;isyys**|Tieosoiteverkon kalibrointipisteiden avulla laskettu alkuet&auml;isyys. Kalibrointipisteen kohdalla alkuet&auml;isyyden l&auml;ht&ouml;aineistona on Tierekisterin tieosoitteet vuonna 2016.|X|
|Loppuet&auml;isyys**|Tieosoiteverkon kalibrointipisteiden avulla laskettu loppuet&auml;isyys. Kalibrointipisteen kohdalla loppuet&auml;isyyden l&auml;ht&ouml;aineistona on Tierekisterin tieosoitteet vuonna 2016.|X|
|ELY|Liikenneviraston ELY-numero.|X|
|Tietyyppi|Muodostetaan Maanmittauslaitoksen hallinnollinen luokka -tiedoista, kts. taulukko alempana.|X|
|Jatkuvuus|Tieosoiteverkon mukainen jatkuvuus-tieto. L&auml;ht&ouml;aineistona Tierekisterin tieosoitteet vuonna 2016.|X|
|Lakkautus|Ei k&auml;yt&ouml;ss&auml; toistaiseksi||

*Muokattu viimeksi -tiedoissa vvh_modified tarkoittaa, ett&auml; muutos on tullut Maanmittauslaitokselta joko geometriaan tai geometrian ominaisuustietoihin.
**Tieosoiteverkon kalibrointipisteet (tieosan alku- ja loppupisteet sek&auml; ajoratakoodin vaihtuminen) m&auml;&auml;rittelev&auml;t mitatut alku- ja loppuet&auml;isyydet. Kalibrointipiste v&auml;lill&auml; alku- ja loppuet&auml;isyydet lasketaan tieosoitesegmenttikohtaisesti Viite-sovelluksessa.

__Tietyypin muodostaminen Viite-sovelluksessa__

J&auml;rjestelm&auml; muodostaa tietyyppi-tiedon automaattisesti Maanmittauslaitoksen aineiston pohjalta seuraavalla tavalla:

|Tietyyppi|Muodostamistapa|
|---------|---------------|
|1 Maantie|MML:n hallinnollinen luokka arvolla 1 = Valtio|
|2 Lauttav&auml;yl&auml; maantiell&auml;|MML:n hallinnollinen luokka arvolla 1 = Valtio ja MML:n kohdeluokka arvolla lautta/lossi|
|3 Kunnan katuosuus|MML:n hallinnollinen luokka arvolla 2 = Kunta|
|5 Yksityistie|MML:n hallinnollinen luokka arvolla 3 = Yksityinen|
|9 Ei tiedossa|MML:lla ei tiedossa hallinnollista luokkaa|

Palautteet hallinnollisen luokan virheist&auml; voi toimittaa Maanmittauslaitokselle osoitteeseen maasto@maanmittauslaitos.fi. Mukaan selvitys virheest&auml; ja sen sijainnista (kuvakaappaus tms.).

##Kohdistaminen tieosoitteeseen tielinkin ID:n avulla##

Kun kohdetta klikkaa kartalla, tulee selaimen osoiteriville n&auml;kyviin valitun kohteen tielinkin ID. Osoiterivill&auml; olevan URL:n avulla voi my&ouml;s kohdistaa k&auml;ytt&ouml;liittym&auml;ss&auml; ko. tielinkkiin. URL:n voi esimerkiksi l&auml;hett&auml;&auml; toiselle henkil&ouml;lle s&auml;hk&ouml;postilla, jolloin h&auml;n p&auml;&auml;see samaan paikkaan k&auml;ytt&ouml;liittym&auml;ss&auml; helposti.

Esimerkiksi: https://devtest.liikennevirasto.fi/viite/#linkProperty/1747227 n&auml;kyy kuvassa osoiterivill&auml; (5). 1747227 on tielinkin ID (eri asia, kuin segmentin ID, jota ei voi k&auml;ytt&auml;&auml; hakemiseen).

![Kohdistaminen tielinkin ID:ll&auml;](k8.JPG)

_Kohdistaminen tielinkin ID:ll&auml;._

5. Tuntemattomat tieosoitesegmentit
--------------------------

Coming soon...