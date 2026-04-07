/**
 * Genera el PDF del plan de vuelo replicando el formulario físico de CAAA.
 * Devuelve un Blob PDF listo para subir al servidor.
 */
export async function generarPdfPlanVuelo(datos, vuelo) {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;

  if (pdfFonts.pdfMake?.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
  }

  const cell = (text, opts = {}) => ({
    text: text ?? "",
    fontSize: 8,
    margin: [3, 3, 3, 3],
    ...opts,
  });

  const label = (text) => cell(text, { fontSize: 6.5, color: "#555", bold: true });

  const field = (lbl, val, extra = {}) => ({
    stack: [label(lbl), cell(val ?? "", { fontSize: 9, ...extra })],
    margin: [2, 2, 2, 2],
  });

  const hdr = (text) => ({
    text,
    fontSize: 7,
    bold: true,
    color: "#fff",
    fillColor: "#1e3a5f",
    alignment: "center",
    margin: [3, 4, 3, 4],
  });

  const reglas = datos.reglas_vuelo || "VFR";

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [28, 36, 28, 36],
    defaultStyle: { font: "Helvetica" },

    content: [
      // ── Encabezado ──────────────────────────────────────────────────────────
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "CAAA", fontSize: 18, bold: true, color: "#1e3a5f" },
              {
                text: "Centro de Adiestramiento Aéreo Académico",
                fontSize: 8,
                color: "#555",
              },
            ],
          },
          {
            width: "auto",
            stack: [
              {
                text: "PLAN DE VUELO",
                fontSize: 16,
                bold: true,
                color: "#1e3a5f",
                alignment: "right",
              },
            ],
          },
        ],
        margin: [0, 0, 0, 8],
      },

      // ── Tabla principal ──────────────────────────────────────────────────────
      {
        table: {
          widths: ["*"],
          body: [
            // Fila 1 — Reglas de vuelo (encabezado de sección)
            [
              {
                table: {
                  widths: ["*"],
                  body: [[hdr("REGLAS DE VUELO")]],
                },
                layout: "noBorders",
                margin: [0, 0, 0, 0],
              },
            ],

            // Fila 2 — Lugar / Fecha / Reglas / Hora
            [
              {
                columns: [
                  field("LUGAR DE SALIDA", datos.lugar_salida, { colSpan: 2 }),
                  field("FECHA", datos.fecha_vuelo),
                  field("REGLAS", reglas),
                  field("HORA (UTC)", datos.hora_vuelo),
                ],
                margin: [0, 0, 0, 0],
              },
            ],

            // Fila 3 — Aeronave / Tipo / Altitud
            [
              {
                columns: [
                  field("IDENT. AERONAVE", vuelo?.aeronave_codigo || datos.ident_aeronave),
                  field("TIPO AERONAVE", vuelo?.aeronave_tipo || datos.tipo_aeronave),
                  field("ALTITUD / NIVEL VUELO", datos.altitud),
                  field("VELOCIDAD", datos.velocidad),
                ],
                margin: [0, 0, 0, 0],
              },
            ],

            // Fila 4 — Ruta
            [
              {
                columns: [
                  { ...field("RUTA", datos.ruta), width: "*" },
                ],
                margin: [0, 0, 0, 0],
              },
            ],

            // Fila 5 — Tiempo de ruta / Combustible / Personas a bordo
            [
              {
                columns: [
                  field("TIEMPO EN RUTA", datos.tiempo_ruta),
                  field("COMBUSTIBLE (ENDURANCE)", datos.combustible),
                  field("PERSONAS A BORDO", String(datos.personas_a_bordo ?? "")),
                  field("COLORES AERONAVE", datos.colores),
                ],
                margin: [0, 0, 0, 0],
              },
            ],

            // Fila 6 — Frecuencias / Destino alterno
            [
              {
                columns: [
                  field("FRECUENCIAS", datos.frecuencias),
                  field("DESTINO ALTERNO", datos.alternativo),
                  field("VOR / DME / ADF", datos.vor_dme_adf),
                  field("ILOP / RADIO", datos.ilop_radio),
                ],
                margin: [0, 0, 0, 0],
              },
            ],

            // Fila 7 — Destino
            [
              {
                columns: [
                  { ...field("DESTINO", datos.destino), width: "*" },
                ],
                margin: [0, 0, 0, 0],
              },
            ],

            // Separador — sección pilotos
            [{ table: { widths: ["*"], body: [[hdr("PILOTOS")]] }, layout: "noBorders" }],

            // Fila 8 — Piloto 1
            [
              {
                columns: [
                  field("PILOTO 1 — NOMBRE", datos.pilot1_nombre),
                  field("LICENCIA", datos.pilot1_licencia),
                  field("DOMICILIO", datos.pilot1_domicilio),
                ],
                margin: [0, 0, 0, 0],
              },
            ],

            // Fila 9 — Piloto 2 (visible solo si hay datos)
            ...(datos.pilot2_nombre
              ? [
                  [
                    {
                      columns: [
                        field("PILOTO 2 — NOMBRE", datos.pilot2_nombre),
                        field("LICENCIA", datos.pilot2_licencia),
                        field("DOMICILIO", datos.pilot2_domicilio),
                      ],
                      margin: [0, 0, 0, 0],
                    },
                  ],
                ]
              : []),

            // Separador — sección observaciones y cierre
            [{ table: { widths: ["*"], body: [[hdr("OBSERVACIONES Y CIERRE")]] }, layout: "noBorders" }],

            // Fila 10 — Observaciones
            [
              {
                columns: [
                  { ...field("OBSERVACIONES", datos.observaciones), width: "*" },
                ],
                margin: [0, 0, 0, 0],
              },
            ],

            // Fila 11 — Piloto al mando / Despacho
            [
              {
                columns: [
                  field("PILOTO AL MANDO", datos.piloto_al_mando),
                  field("DESPACHO / FIRMA", datos.despacho),
                ],
                margin: [0, 0, 0, 0],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#aaa",
          vLineColor: () => "#aaa",
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },

      // ── Pie de página ────────────────────────────────────────────────────────
      {
        text: "IMPRESOS RIVAS  TEL: 2225-8205",
        fontSize: 6.5,
        color: "#888",
        alignment: "center",
        margin: [0, 10, 0, 0],
      },
    ],
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBlob((blob) => resolve(blob));
    } catch (err) {
      reject(err);
    }
  });
}
