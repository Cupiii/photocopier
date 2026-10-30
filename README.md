# photocopier

Mit dem Handy ein Foto machen und es am Desktop direkt in die Zwischenablage kopieren.

## Start

Voraussetzung: [Node.js](https://nodejs.org) ab Version 18. Es werden keine Pakete installiert.

```sh
node server.js
```

1. Am Desktop **http://localhost:8080** öffnen.
2. Den angezeigten QR-Code mit dem Handy scannen (Handy und Rechner im selben WLAN).
3. Auf dem Handy **Foto machen** tippen – das Bild erscheint sofort am Desktop.
4. Am Desktop **Kopieren** klicken (oder aufs Bild) und mit Strg/⌘ + V einfügen.
   Ist das Desktop-Fenster aktiv, wird ein neues Foto automatisch kopiert.

Anderer Port: `PORT=3000 node server.js`

## Hinweise

- Die Desktop-Seite muss über `localhost` geöffnet werden: Browser erlauben das Kopieren
  von Bildern in die Zwischenablage nur auf „sicheren“ Seiten, und `localhost` zählt dazu.
- Fotos werden auf dem Handy auf max. 2560 px verkleinert (abschaltbar mit „Originalgröße senden“).
- Fotos liegen nur im Arbeitsspeicher (die letzten 20) und sind nach einem Neustart weg.
- Jeder im selben Netzwerk kann die Seite erreichen – nur im eigenen WLAN verwenden.
- Blockiert die Firewall den Zugriff vom Handy, Port 8080 für das lokale Netz freigeben.
