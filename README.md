# photocopier

Fotos, Dateien und Texte zwischen Handy und Rechner (oder zwischen zwei Rechnern) schicken – direkt im
Browser, ohne App, ohne Konto, ohne Cloud-Speicher.

Typischer Fall: Mit dem Handy ein Foto machen, und Sekunden später liegt es am Rechner in der
Zwischenablage und lässt sich mit Strg/⌘ + V in ein Dokument, eine Mail oder einen Chat einfügen.

**Zur App:** https://cupiii.github.io/photocopier/

## Anleitung

### Foto vom Handy in die Zwischenablage

1. Am Rechner die App öffnen. Sie zeigt einen QR-Code.
2. Den QR-Code mit der Handy-Kamera scannen und den Link öffnen.
   Das Handy muss dafür nicht im selben WLAN sein, mobile Daten reichen.
3. Am Handy auf **Foto machen** tippen und ein Foto aufnehmen.
4. Am Rechner erscheint das Foto. Ist das Fenster gerade aktiv, liegt es schon in der
   Zwischenablage; sonst auf **Kopieren** (oder aufs Bild) klicken.
5. Mit Strg/⌘ + V einfügen.

Fotos werden vor dem Senden auf höchstens 2560 Pixel verkleinert. Mit dem Häkchen
„Fotos in Originalgröße senden“ lässt sich das abschalten.

### Dateien teilen

- **📎 Dateien senden** gibt es auf allen Geräten; mehrere Dateien auf einmal sind möglich.
  Am Rechner können Dateien auch einfach ins Fenster gezogen werden.
- **Rechner ↔ Rechner:** Den Link (oder QR-Code) statt am Handy an einem zweiten Rechner öffnen.
- Empfangene Dateien erscheinen unter **Empfangen** und lassen sich herunterladen.
  Bilder können zusätzlich in die Zwischenablage kopiert werden, am Handy auch über **📤 Teilen**
  z. B. in der Galerie gespeichert werden.

### Text und Links schicken

Ins Feld **„Text oder Link senden …“** tippen oder einfügen und **Senden** drücken
(am Rechner auch Strg/⌘ + Enter). Beim Empfänger erscheint der Text mit **Kopieren**-Knopf;
ist das Fenster gerade aktiv, liegt er schon in der Zwischenablage. Ist der Text ein Link,
gibt es zusätzlich **↗** zum Öffnen.

**Wer schickt an wen?** Der Rechner, der den QR-Code anzeigt, ist die Zentrale. Was er sendet,
geht an alle verbundenen Geräte. Die verbundenen Geräte senden an die Zentrale, aber nicht
direkt untereinander.

### Link und Sicherheit

- Jeder Browser, der die App öffnet, bekommt eine eigene zufällige Kennung; sie steht im Link
  hinter dem `#`. Mehrere Leute können die App also gleichzeitig nutzen, ohne sich zu stören.
- Der Link bleibt pro Browser gleich und kann am Handy als Lesezeichen gespeichert werden.
  (Ausnahme: private Fenster bekommen bei jedem Öffnen einen neuen Link.)
- **Wer den Link kennt, kann dir Dateien schicken.** Er kann aber nichts von dir abrufen.
  Ist ein Link in falsche Hände geraten: **↻ Neuen Link erzeugen** – der alte funktioniert dann
  nicht mehr.
- Die App darf pro Browser nur in einem Tab offen sein.

## Wie es funktioniert: WebRTC

Die App ist eine einzige statische HTML-Datei (`docs/index.html`), kostenlos gehostet über
GitHub Pages. Es gibt keinen eigenen Server, der Dateien entgegennimmt oder speichert.

Die Übertragung läuft über **WebRTC** („Web Real-Time Communication“). Das ist ein Standard,
den alle modernen Browser eingebaut haben – dieselbe Technik steckt in Videokonferenzen im
Browser. WebRTC baut eine **direkte, verschlüsselte Verbindung zwischen zwei Browsern** auf
(„Peer-to-Peer“). Die Dateien gehen also in aller Regel auf direktem Weg von Gerät zu Gerät
und werden nirgends gespeichert.

Damit sich zwei Browser finden, braucht es am Anfang einen Vermittler:

```
   Handy                    PeerJS-Server                  Rechner
     │                     (Vermittlung)                      │
     │── „Ich will zu photocopier-…“ ──▶│                     │
     │                                  │── leitet weiter ──▶ │
     │◀───────── tauschen Netzwerk-Adressen aus ────────────▶ │
     │                                                        │
     │◀════════ direkte, verschlüsselte Verbindung ═════════▶ │
                  Fotos und Dateien fließen nur hier
```

1. **Vermittlung (Signaling):** Beide Browser melden sich beim kostenlosen öffentlichen
   [PeerJS](https://peerjs.com)-Server an. Der Rechner unter seiner Kennung aus dem Link, das
   Handy fragt nach genau dieser Kennung. Über den Server tauschen beide kurz aus, wie sie
   erreichbar sind.
2. **Weg finden (ICE/STUN):** Die meisten Geräte stecken hinter einem Router und haben keine
   öffentliche Adresse. Mit Hilfe eines STUN-Servers findet jeder Browser heraus, wie er von
   außen aussieht, und beide versuchen, sich gegenseitig direkt zu erreichen
   („NAT-Traversal“). Im selben WLAN klappt das praktisch immer, über Mobilfunk meistens.
   Klappt es nicht, springt als Notlösung ein **TURN-Server** von PeerJS ein: Er leitet die
   Daten dann weiter, statt dass sie direkt fließen. Auch dann bleiben sie verschlüsselt –
   der TURN-Server reicht nur verschlüsselte Pakete durch und kann die Dateien nicht lesen.
3. **Verbindung (DataChannel):** Steht die Verbindung, schicken sich die Browser die Dateien
   über einen verschlüsselten WebRTC-Datenkanal (DTLS). Der Vermittlungsserver sieht die
   Dateien nie. Dateien gehen in Stücken von 256 KB raus; der Empfänger meldet zurück, wie
   viel angekommen ist. Daraus entsteht der Fortschrittsbalken auf beiden Seiten.

Die Bibliothek **PeerJS** nimmt der App dabei die Details ab. Der QR-Code wird mit der
Bibliothek **qrcode-generator** erzeugt; beide werden von einem CDN geladen.

Die Zwischenablage wird über die **Clipboard API** des Browsers beschrieben. Weil Browser dort
zuverlässig nur PNG-Bilder annehmen, wandelt die App jedes Bild vorher in PNG um.

## Was die App noch nicht kann

- **Keine Speicherung:** Empfangene Dateien liegen nur im geöffneten Browser-Tab. Neu laden
  oder schließen – und sie sind weg. Wichtiges also herunterladen.
- **Beide Geräte müssen gleichzeitig online sein.** Eine Datei für später hinterlegen geht nicht.
- **Sehr große Dateien** (mehrere hundert MB, z. B. lange Videos) können beim **Empfänger**
  scheitern: Er hält die Datei bis zum Herunterladen komplett im Arbeitsspeicher – auf Handys
  ist der knapp. (Der Sender liest die Datei dagegen stückweise.)
- **Keine Übertragung zwischen zwei verbundenen Geräten:** Alles läuft über den Rechner mit
  dem QR-Code. Zwei Handys können sich nicht direkt etwas schicken.
- **Übertragungen nicht fortsetzbar:** Bricht die Verbindung mitten in einer Datei ab, muss
  sie neu gesendet werden.
- **Kein Passwort:** Schutz bietet nur der zufällige Link.
- **Strenge Netzwerke:** In manchen Firmen- oder Hotel-Netzen kommt keine direkte Verbindung
  zustande. Dann hilft der kostenlose TURN-Server von PeerJS aus – der ist aber langsamer und
  ohne Garantie; ganz restriktive Netze blockieren auch ihn.
- **Abhängig von fremden Diensten:** Fällt der kostenlose PeerJS-Server oder ein CDN aus,
  funktioniert die App in der Zeit nicht.
- **Zwischenablage nur für Bilder und Text** (keine anderen Dateien), und das Kopieren von
  Bildern klappt nicht in jedem Browser (am zuverlässigsten in Chrome, Edge und Safari;
  in Firefox erst ab neueren Versionen).

## Selbst hosten

Die App ist nur die Datei `docs/index.html`. Sie lässt sich überall ablegen, wo statische
Seiten ausgeliefert werden – die Seite muss nur über **HTTPS** erreichbar sein (wegen
Zwischenablage und WebRTC).

- **GitHub Pages:** Settings → Pages → „Deploy from a branch“ → Branch `main`, Ordner `/docs`.
  Kostenlos für öffentliche Repositories.
- **Netlify / Cloudflare Pages:** Repository verbinden, Ausgabe-Ordner `docs`.
  Kostenlos, auch für private Repositories.

## Alternative: lokal mit Node.js

Im Repository liegt außerdem eine ältere, einfachere Variante, die ohne Internet im eigenen
WLAN läuft. Sie kann **nur Fotos vom Handy zum Rechner** schicken.

Voraussetzung: [Node.js](https://nodejs.org) ab Version 18 (keine weiteren Pakete).

```sh
node server.js            # anderer Port: PORT=3000 node server.js
```

1. Am Rechner **http://localhost:8080** öffnen (wichtig: `localhost`, sonst erlaubt der Browser
   das Kopieren in die Zwischenablage nicht).
2. Die angezeigte Adresse am Handy öffnen (Handy und Rechner im selben WLAN).
3. Foto machen → am Rechner **Kopieren** → Strg/⌘ + V.

Hier laufen die Fotos über den kleinen Server auf dem eigenen Rechner (die letzten 20, nur im
Arbeitsspeicher). Jeder im selben WLAN kann die Seite erreichen. Blockiert die Firewall das
Handy, Port 8080 im lokalen Netz freigeben.
