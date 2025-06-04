<script>
  document.getElementById("arrangeButton").addEventListener("click", () => {
    const xmlFile = document.getElementById("xmlSelect").value;
    const instrument = document.getElementById("instrumentSelect").value;

    if (!xmlFile || !instrument) {
      alert("Please select both an XML file and an instrument.");
      return;
    }

    // Define octave shifts per instrument
    const octaveShiftMap = {
      "Soprano": 1,
      "Violin": 1,
      "Bb Clarinet": 1,
      "Double Bass": -2
    };

    const shiftAmount = octaveShiftMap[instrument];

    fetch(xmlFile)
      .then(response => response.text())
      .then(xmlText => {
        let transformedXml = xmlText;

        // 1. Apply octave transformation
        transformedXml = transformedXml.replace(/<octave>(\d+)<\/octave>/g, (match, p1) => {
          const original = parseInt(p1);
          const shifted = original + shiftAmount;
          return `<octave>${shifted}</octave>`;
        });

        // 2. Update <part-name> to selected instrument
        transformedXml = transformedXml.replace(
          /<part-name>[^<]*<\/part-name>/,
          `<part-name>${instrument}</part-name>`
        );

        // Trigger download
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
</script>
