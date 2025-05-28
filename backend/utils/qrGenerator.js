// utils/qrGenerator.js
const qrcode = require('qrcode'); // Necesitarás instalar: npm install qrcode

const generateQrDataForPayment = async (pedidoInfo) => {
  // pedidoInfo debe contener al menos: codigo_pedido, total_pedido
  console.log('Generando datos QR para el pedido:', pedidoInfo);

  // Datos ficticios para la cuenta bancaria de DIAMANTECH
  const datosBancarios = "201-51895636-3-15"; // Número de cuenta de ejemplo
  const nombreBeneficiario = "DIAMANTECH Joyería Online";
  const bancoBeneficiario = "Banco Ficticio S.A.";
  const moneda = "BOB"; // O la moneda que uses

  // La referencia debe ser única para conciliar pagos, usamos el código del pedido.
  const referencia = `Pedido ${pedidoInfo.codigo_pedido}`;
  const monto = pedidoInfo.total_pedido;

  // Estructura de datos común para QRs de pago en algunos sistemas (esto es un ejemplo, puede variar)
  // Para Bolivia, se usa mucho el QR "Simple" que es más una transferencia directa.
  // La cadena que se codificará en el QR puede ser una URL a una pasarela, o datos para transferencia.
  // Aquí simulamos una cadena con los datos para una transferencia manual.
  const qrString = `
Beneficiario: ${nombreBeneficiario}
Banco: ${bancoBeneficiario}
Cuenta: ${datosBancarios}
Monto: ${monto} ${moneda}
Referencia: ${referencia}
Concepto: Compra en DIAMANTECH
`.trim(); // trim() para quitar espacios extra al inicio/final

  let qrCodeImageUrl = null;
  try {
    // Generar el QR como Data URL (imagen base64)
    qrCodeImageUrl = await qrcode.toDataURL(qrString, { errorCorrectionLevel: 'H', width: 250 });
  } catch (err) {
    console.error('Error al generar el QR code image:', err);
    // No detenemos el flujo, podemos seguir con la cadena de texto
  }

  return {
    qrDataString: qrString, // La cadena de texto con la información
    qrImageUrl: qrCodeImageUrl, // La imagen del QR como Data URL (puede ser null si falla)
    message: "Escanea el código QR con tu aplicación bancaria o utiliza los datos proporcionados para realizar la transferencia.",
    instructions: `Realiza una transferencia por ${monto} ${moneda} a la cuenta ${datosBancarios} de ${nombreBeneficiario} en ${bancoBeneficiario}. Utiliza "${referencia}" como glosa/referencia del pago.`
  };
};

module.exports = {
  generateQrDataForPayment,
};
