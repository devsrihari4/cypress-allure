const { defineConfig } = require("cypress");
const allureWriter = require('@shelex/cypress-allure-plugin/writer');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('after:run', (results) => {
        // 1. Define results directory
        const resultsDir = path.join(__dirname, 'cypress/results')
    
        // 2. Create the results directory, if it doesn't exist
        if (!fs.existsSync(resultsDir)) {
          fs.mkdirSync(resultsDir, { recursive: true })
        }
    
        // 3. Write the results to a file 
        // Each parallel runner need its own results file. 
        // Use randomUUID to ensure uniqueness
        const fileName = `test-results-${randomUUID()}.json`
    
        // 4. Write the result to the results directory
        const filePath = path.join(resultsDir, fileName)
        fs.writeFileSync(filePath, JSON.stringify(results, null, 2))
      })
    
      return config
    }
  },
});
