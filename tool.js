document.getElementById("arrangeButton").addEventListener("click", () => {
  const xmlFile = document.getElementById("xmlSelect").value;
  const instrument = document.getElementById("instrumentSelect").value;

  if (!xmlFile || !instrument) {
    alert("Please select both an XML file and an instrument.");
    return;
  }

  const config = {
    "Soprano": {
      octaveShift: 1,
      clef: "treble",
      transpose: null,
      showLyrics: true,
      hideChords: true,
      useSlashNotation: false
    },
    "Violin": {
      octaveShift: 1,
      clef: "treble",
      transpose: null,
      showLyrics: false,
      hideChords: true,
      useSlashNotation: false
    },
    "Bb Clarinet": {
      octaveShift: 1,
      clef: "treble",
      transpose: `<transpose><diatonic>0</diatonic><chromatic>2</chromatic></transpose>`,
      showLyrics: false,
      hideChords: true,
      useSlashNotation: false
    },
    "Double Bass": {
      octaveShift: -2,
      clef: "bass",
      transpose: null,
      showLyrics: false,
      hideChords: true,
      useSlashNotation: false
    }
  };

  const { octaveShift, clef, transpose, showLyrics, hideChords, useSlashNotation } = config[instrument];

  const clefTemplates = {
    treble: `<sign>G</sign><line>2</line>`,
    bass: `<sign>F</sign><line>4</line>`
  };

  fetch(xmlFile)
    .then(response => response.text())
    .then(xmlText => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");

      // 1. Octave shift
      const octaves = xmlDoc.querySelectorAll("octave");
      octaves.forEach(oct => {
        const newVal = parseInt(oct.textContent) + octaveShift;
        oct.textContent = newVal;
      });

      // 2. Part-name update
      const partName = xmlDoc.querySelector("score-part part-name");
      if (partName) partName.textContent = instrument;

      // 3. Clef replacement
      const clefNode = xmlDoc.querySelector("clef");
      if (clefNode) {
        while (clefNode.firstChild) clefNode.removeChild(clefNode.firstChild);
        const clefFragment = parser.parseFromString(
          `<dummy>${clefTemplates[clef]}</dummy>`,
          "application/xml"
        );
        const newClef = clefFragment.querySelector("dummy");
        while (newClef.firstChild) clefNode.appendChild(newClef.firstChild);
      }

      // 4a. Transpose in <score-part>
      if (transpose) {
        const scorePart = xmlDoc.querySelector("score-part");
        if (scorePart) {
          const existing = scorePart.querySelector("transpose");
          if (existing) existing.remove();
          const transNode = parser.parseFromString(
            `<dummy>${transpose}</dummy>`,
            "application/xml"
          ).querySelector("transpose");
          scorePart.appendChild(transNode);
        }
      }

      // 4b. Transpose in <attributes> (after <key>)
      if (transpose) {
        const attributes = xmlDoc.querySelector("attributes");
        if (attributes) {
          const existing = attributes.querySelector("transpose");
          if (existing) existing.remove();
          const transNode = parser.parseFromString(
            `<dummy>${transpose}</dummy>`,
            "application/xml"
          ).querySelector("transpose");
          const key = attributes.querySelector("key");
          if (key && key.nextSibling) {
            attributes.insertBefore(transNode, key.nextSibling);
          } else {
            attributes.appendChild(transNode);
          }
        }
      }

      // 5. Remove lyrics if needed
      if (!showLyrics) {
        const lyrics = xmlDoc.querySelectorAll("lyric");
        lyrics.forEach(node => node.remove());
      }

      // 6. Remove chord symbols if needed
      if (hideChords) {
        const harmonies = xmlDoc.querySelectorAll("harmony");
        harmonies.forEach(node => node.remove());
      }

      // 7. Slash notation
      if (useSlashNotation) {
        const notes = xmlDoc.querySelectorAll("note");
        notes.forEach(note => {
          if (note.querySelector("notehead")) return;

          const pitch = note.querySelector("pitch");
          const rest = note.querySelector("rest");

          const slashNode = xmlDoc.createElement("notehead");
          slashNode.textContent = "slash";

          if (pitch) {
            pitch.parentNode.insertBefore(slashNode, pitch.nextSibling);
          } else if (rest) {
            rest.parentNode.insertBefore(slashNode, rest.nextSibling);
          }
        });
      }

      // 8. Serialize and download
      const serializer = new XMLSerializer();
      const transformedXml = serializer.serializeToString(xmlDoc);

      const blob = new Blob([transformedXml], { type: "application/xml" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `arranged_${instrument.replace(/\s+/g, "_")}.xml`;
      link.click();
    })
    .catch(error => {
      console.error("Error fetching or processing the XML file:", error);
      alert("Failed to fetch or process the XML file.");
    });
});
