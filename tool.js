document.getElementById("arrangeButton").addEventListener("click", () => {
  const xmlFile = document.getElementById("xmlSelect").value;
  const instrument = document.getElementById("instrumentSelect").value;

  if (!xmlFile || !instrument) {
    alert("Please select both an XML file and an instrument.");
    return;
  }

  // Define instrument-specific transformations
  const config = {
    "Soprano":     { octaveShift: 1, clef: "treble", transpose: null },
    "Violin":      { octaveShift: 1, clef: "treble", transpose: null },
    "Bb Clarinet": {
      octaveShift: 1,
      clef: "treble",
      transpose: `<transpose><diatonic>0</diatonic><chromatic>-2</chromatic></transpose>`
    },
    "Double Bass": { octaveShift: -2, clef: "bass", transpose: null }
  };

  const { octaveShift, clef, transpose } = config[instrument];

  // Define clef XML snippets
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

      // 4a. Replace or insert <transpose> block inside <score-part>
      transformedXml = transformedXml.replace(
        /(<score-part[^>]*>[\s\S]*?<part-name>[^<]*<\/part-name>)([\s\S]*?)(<\/score-part>)/,
        (match, startTag, middle, endTag) => {
          const cleanedMiddle = middle.replace(/<transpose>[\s\S]*?<\/transpose>/g, "");
          const newTranspose = transpose ? `\n    ${transpose}` : "";
          return `${startTag}${cleanedMiddle}${newTranspose}\n  ${endTag}`;
        }
      );

      // 4b. Also insert transpose into first <measure>'s <attributes> block
      if (transpose) {
        transformedXml = transformedXml.replace(
          /(<part[^>]*>[\s\S]*?<measure[^>]*>[\s\S]*?<attributes[^>]*>)/,
          `$1\n      ${transpose}`
        );
      }

      // 5. Trigger download
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
