document.getElementById("arrangeButton").addEventListener("click", () => {
  const xmlFile = document.getElementById("xmlSelect").value;
  const instrument = document.getElementById("instrumentSelect").value;

  if (!xmlFile || !instrument) {
    alert("Please select both an XML file and an instrument.");
    return;
  }

  // Configuration per instrument
  const config = {
    "Soprano": {
      octaveShift: 1,
      clef: "treble",
      transpose: null,
      hideChords: true,
      showLyrics: true,
      useSlashNotation: false
    },
    "Violin": {
      octaveShift: 1,
      clef: "treble",
      transpose: null,
      hideChords: true,
      showLyrics: false,
      useSlashNotation: false
    },
    "Bb Clarinet": {
      octaveShift: 1,
      clef: "treble",
      transpose: `<transpose><diatonic>0</diatonic><chromatic>2</chromatic></transpose>`,
      hideChords: true,
      showLyrics: false,
      useSlashNotation: false
    },
    "Double Bass": {
      octaveShift: -2,
      clef: "bass",
      transpose: null,
      hideChords: true,
      showLyrics: false,
      useSlashNotation: false
    }
  };

  const {
    octaveShift,
    clef,
    transpose,
    hideChords,
    showLyrics,
    useSlashNotation
  } = config[instrument];

  const clefTemplates = {
    treble: `<clef><sign>G</sign><line>2</line></clef>`,
    bass: `<clef><sign>F</sign><line>4</line></clef>`
  };

  fetch(xmlFile)
    .then(response => response.text())
    .then(xmlText => {
      let transformedXml = xmlText;

      // 1. Shift all <octave> values
      transformedXml = transformedXml.replace(/<octave>(\d+)<\/octave>/g, (match, p1) => {
        const original = parseInt(p1);
        const shifted = original + octaveShift;
        return `<octave>${shifted}</octave>`;
      });

      // 2. Update <part-name>
      transformedXml = transformedXml.replace(
        /<part-name>[^<]*<\/part-name>/,
        `<part-name>${instrument}</part-name>`
      );

      // 3. Replace <clef> block
      transformedXml = transformedXml.replace(
        /<clef>[\s\S]*?<\/clef>/,
        clefTemplates[clef]
      );

      // 4a. Replace or insert <transpose> block in <score-part>
      transformedXml = transformedXml.replace(
        /(<score-part[^>]*>[\s\S]*?<part-name>[^<]*<\/part-name>)([\s\S]*?)(<\/score-part>)/,
        (match, startTag, middle, endTag) => {
          const cleanedMiddle = middle.replace(/<transpose>[\s\S]*?<\/transpose>/g, "");
          const newTranspose = transpose ? `\n    ${transpose}` : "";
          return `${startTag}${cleanedMiddle}${newTranspose}\n  ${endTag}`;
        }
      );

      // 4b. Also insert <transpose> into the first <measure>'s <attributes> block
      if (transpose) {
        transformedXml = transformedXml.replace(
          /(<part[^>]*>[\s\S]*?<measure[^>]*>[\s\S]*?<attributes[^>]*>)/,
          `$1\n      ${transpose}`
        );
      }

      // 4c. Remove all <harmony> tags if chords should be hidden
      if (hideChords) {
        transformedXml = transformedXml.replace(/<harmony[\s\S]*?<\/harmony>/g, "");
      }

      // 4d. Remove all <lyric> tags if lyrics should be hidden
      if (!showLyrics) {
        transformedXml = transformedXml.replace(/<lyric[\s\S]*?<\/lyric>/g, "");
      }



      // 5. Trigger download of modified XML
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
