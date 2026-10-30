// Photocopier: Handy macht ein Foto, Desktop kopiert es in die Zwischenablage.
// Keine Abhängigkeiten – nur Node.js (>= 18). Start: node server.js
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 8080;
const MAX_PHOTOS = 20;
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;
const PUBLIC_DIR = path.join(__dirname, 'public');

const photos = []; // { id, type, data, time } – nur im Speicher, neueste zuerst
const clients = new Set(); // offene Server-Sent-Events-Verbindungen

function lanUrls() {
  const urls = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const iface of list || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        urls.push(`http://${iface.address}:${PORT}/phone`);
      }
    }
  }
  return urls;
}

function meta(p) {
  return { id: p.id, type: p.type, size: p.data.length, time: p.time };
}

function broadcast(event, payload) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) res.write(msg);
}

function sendFile(res, file, type) {
  fs.readFile(path.join(PUBLIC_DIR, file), (err, data) => {
    if (err) return send(res, 404, 'Nicht gefunden');
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(data);
  });
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

function handleUpload(req, res) {
  const type = (req.headers['content-type'] || '').split(';')[0];
  if (!type.startsWith('image/')) return send(res, 415, 'Nur Bilder erlaubt');

  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_UPLOAD_BYTES) {
      send(res, 413, 'Bild zu groß');
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (res.writableEnded) return;
    const photo = {
      id: crypto.randomBytes(6).toString('hex'),
      type,
      data: Buffer.concat(chunks),
      time: Date.now(),
    };
    photos.unshift(photo);
    photos.length = Math.min(photos.length, MAX_PHOTOS);
    broadcast('photo', meta(photo));
    console.log(`Foto empfangen: ${photo.id} (${Math.round(size / 1024)} KB)`);
    send(res, 200, JSON.stringify(meta(photo)), 'application/json');
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/') {
    return sendFile(res, 'index.html', 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && url.pathname === '/phone') {
    return sendFile(res, 'phone.html', 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && url.pathname === '/info') {
    return send(res, 200, JSON.stringify({ phoneUrls: lanUrls() }), 'application/json');
  }
  if (req.method === 'POST' && url.pathname === '/upload') {
    return handleUpload(req, res);
  }
  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    });
    res.write(`event: list\ndata: ${JSON.stringify(photos.map(meta))}\n\n`);
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => {
      clearInterval(ping);
      clients.delete(res);
    });
    return;
  }
  const match = url.pathname.match(/^\/photos\/([0-9a-f]+)$/);
  if (match) {
    const index = photos.findIndex((p) => p.id === match[1]);
    if (index === -1) return send(res, 404, 'Nicht gefunden');
    if (req.method === 'DELETE') {
      photos.splice(index, 1);
      broadcast('delete', { id: match[1] });
      return send(res, 204, '');
    }
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': photos[index].type, 'Cache-Control': 'no-store' });
      return res.end(photos[index].data);
    }
  }
  send(res, 404, 'Nicht gefunden');
});

server.listen(PORT, () => {
  console.log(`\nPhotocopier läuft.\n`);
  console.log(`  Desktop:  http://localhost:${PORT}`);
  for (const u of lanUrls()) console.log(`  Handy:    ${u}`);
  console.log(`\nHandy und Rechner müssen im selben WLAN sein.\n`);
});
