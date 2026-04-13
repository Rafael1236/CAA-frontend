
export async function generarPdfLoadsheet(form, waypoints, vuelo) {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;

  if (pdfFonts.pdfMake?.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
  }

  const alumnoNombre = vuelo
    ? `${vuelo.alumno_nombre ?? ""} ${vuelo.alumno_apellido ?? ""}`.trim()
    : "";

  const cell = (text, opts = {}) => ({
    text: String(text ?? ""),
    fontSize: 7,
    margin: [2, 2, 2, 2],
    ...opts,
  });

  const hdr = (text, opts = {}) => ({
    text,
    fontSize: 6.5,
    bold: true,
    color: "#fff",
    fillColor: "#1e3a5f",
    alignment: "center",
    margin: [2, 3, 2, 3],
    ...opts,
  });

  const labelVal = (lbl, val) => ({
    stack: [
      { text: lbl, fontSize: 5.5, color: "#555", bold: true, margin: [0, 0, 0, 1] },
      { text: String(val ?? ""), fontSize: 8 },
    ],
    margin: [3, 2, 3, 2],
  });

  const headerRow = {
    columns: [
      {
        width: "*",
        stack: [
          { text: "CAAA", fontSize: 16, bold: true, color: "#1e3a5f" },
          { text: "Centro de Adiestramiento Aéreo Académico", fontSize: 7, color: "#555" },
        ],
      },
      {
        width: "auto",
        text: "LOADSHEET DE NAVEGACIÓN",
        fontSize: 13,
        bold: true,
        color: "#1e3a5f",
        alignment: "right",
        margin: [0, 4, 0, 0],
      },
    ],
    margin: [0, 0, 0, 6],
  };

  const infoRow = {
    table: {
      widths: ["*", "*", "*", "*", "*", "*"],
      body: [
        [
          labelVal("DEP", "MSSS"),
          labelVal("DEST", "MSSS"),
          labelVal("REG", vuelo?.aeronave_codigo ?? ""),
          labelVal("TYPE", vuelo?.aeronave_modelo ?? ""),
          labelVal("PIC", alumnoNombre),
          labelVal("STUDENT", alumnoNombre),
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#aaa",
      vLineColor: () => "#aaa",
    },
    margin: [0, 0, 0, 5],
  };

  const fuelItems = [
    ["TAXI",            form.taxi],
    ["TRIP",            form.trip],
    ["R/R 5%",          form.rr_5],
    ["ALT 1 (IFR)",     form.alt1_ifr],
    ["ALT 2 (IFR)",     form.alt2_ifr],
    ["FINAL RESERVE",   form.final_reserve],
    ["MIN REQ",         form.min_req],
    ["EXTRA",           form.extra],
    ["TFOB",            form.tfob],
  ];

  const fuelTable = {
    table: {
      widths: [80, 50],
      body: [
        [hdr("FUEL PLANNING", { colSpan: 1 }), hdr("US GAL")],
        ...fuelItems.map(([lbl, val]) => [
          cell(lbl, { bold: true }),
          cell(val ?? "", { alignment: "right" }),
        ]),
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#aaa",
      vLineColor: () => "#aaa",
    },
    margin: [0, 0, 0, 5],
  };

  const wpCols = [
    "WAYPOINT", "ALT/FL", "W/V", "TC", "VAR", "MC",
    "WCA", "MH", "DEV", "CH", "TAS", "GS",
    "NM", "ETA", "ATA", "FUEL REQ", "FUEL ACT",
  ];

  const wpWidths = [45, 28, 28, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 28, 28, 32, 32];

  const wpRows = (waypoints ?? []).map((wp) => [
    cell(wp.waypoint),  cell(wp.alt_fl),   cell(wp.wv),
    cell(wp.tc),        cell(wp.var),      cell(wp.mc),
    cell(wp.wca),       cell(wp.mh),       cell(wp.dev),
    cell(wp.ch),        cell(wp.tas),      cell(wp.gs),
    cell(wp.nm),        cell(wp.eta),      cell(wp.ata),
    cell(wp.fuel_req),  cell(wp.fuel_act),
  ]);

  while (wpRows.length < 5) {
    wpRows.push(wpCols.map(() => cell("")));
  }

  const waypointTable = {
    table: {
      widths: wpWidths,
      body: [
        wpCols.map((c) => hdr(c)),
        ...wpRows,
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#bbb",
      vLineColor: () => "#bbb",
    },
  };

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [20, 28, 20, 28],
    defaultStyle: { font: "Helvetica" },
    content: [
      headerRow,
      infoRow,
      {
        columns: [
          { width: "auto", stack: [fuelTable] },
          { width: "*",    stack: [waypointTable], margin: [8, 0, 0, 0] },
        ],
      },
      {
        text: "IMPRESOS RIVAS  TEL: 2225-8205",
        fontSize: 5.5,
        color: "#888",
        alignment: "center",
        margin: [0, 8, 0, 0],
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
