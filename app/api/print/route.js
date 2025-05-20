import net from 'net';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { serial } = req.body;

  if (!serial) {
    return res.status(400).json({ error: 'Serial number is required' });
  }

  // ZPL format for barcode
  const zpl = `
^XA
^FO50,50^BCN,100,Y,N,N
^FD${serial}^FS
^XZ
  `;

  const PRINTER_IP = '192.168.1.100'; // ⚠️ Replace with your actual printer IP
  const PRINTER_PORT = 9100; // Default ZPL port

  const client = new net.Socket();

  try {
      client.connect(PRINTER_PORT, PRINTER_IP, () => {
        console.log(`Connected to printer at ${PRINTER_IP}:${PRINTER_PORT}`);
        client.write(zpl);
        client.end();
      });

      client.on('close', () => {
        console.log('Disconnected from printer.');
        res.status(200).json({ message: 'Printed successfully' });
      });

      client.on('error', (err) => {
        console.error('Printer error:', err);
        res.status(500).json({ error: 'Failed to connect to printer: ' + err.message });
      });
  } catch (error) {
    console.error("Error during printing process", error);
    res.status(500).json({error: "Error during printing: " + error.message})
  }
}