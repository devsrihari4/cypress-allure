const fs = require('fs')
const path = require('path')
const process = require('process')

// 1. Define the results directory and the merged results file path
const resultsDir = path.join(__dirname, 'results')
const mergedResultsFilePath = path.join(resultsDir, 'merged-results.json')

// 2. Create your custom result format JSON
// Below is an example of example metrics, you can customize it to suite your needs
const overallResults = {
  totalDuration: 0,
  totalTests: 0,
  totalPassed: 0,
  totalFailed: 0,
  totalPending: 0,
  totalSkipped: 0,
  flakePercentage: 0,
}
const flakyTests = []
const slowestTests = []
const errors = []

const mergedResults = {
  ...overallResults,
  flakyTests,
  slowestTests,
  errors,
}

// 3. Helper methods 
// Mine convert milliseconds to minutes for better readability
const convertMSToSeconds = (ms) => (ms / 1000).toFixed(2)
const convertSecondsToMinutes = (ms) => (convertMSToSeconds(ms) / 60).toFixed(2)

// Core Method
const mergeResults = () => {
  // 4. Check if the results directory exists, exit if not
  if (!fs.existsSync(resultsDir)) {
    console.error('❌ No results directory found.')
    process.exit(1)
  }

  const resultFiles = fs
    .readdirSync(resultsDir)
    .filter((file) => file.endsWith('.json') && file !== 'merged-results.json')

  // 5. Loop through and read each individual result file
  // Save off the results into a JSON object
  resultFiles.forEach((file) => {
    const filePath = path.join(resultsDir, file)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    // 6. Loop through each test run and extract the relevant metrics
    data.runs.forEach((run) => {
      run.tests.forEach((test) => {
        // Flaky Tests
        // A test is considered flaky if it has multiple attempts and at least one of them passed
        if (
          test.attempts.length > 1 &&
          test.attempts.some((attempt) => attempt.state === 'passed')
        ) {
          flakyTests.push({ test: test.title.join(' - ') })
        }

        // Errors
        // A test is considered to have failed if its state is 'failed' and it has a displayError
        if (test.state === 'failed') {
          const error = test.displayError
          errors.push({
            test: test.title.join(' - '),
            error,
          })
        }

        // Slowest Tests
        // Save off all test regardless of their state
        slowestTests.push({
          test: test.title.join(' - '),
          duration: convertMSToSeconds(test.duration),
        })
      })
    })

    // Overall Results
    mergedResults.totalDuration += data.totalDuration
    mergedResults.totalTests += data.totalTests
    mergedResults.totalPassed += data.totalPassed
    mergedResults.totalFailed += data.totalFailed
    mergedResults.totalPending += data.totalPending
    mergedResults.totalSkipped += data.totalSkipped
  })

  // 7. Now that all files have been processed, we can calculate overall metrics
  // Convert total duration into a readable format
  mergedResults.totalDuration = `${convertSecondsToMinutes(mergedResults.totalDuration)} min`
  // Sort the slowest tests by duration
  slowestTests.sort((a, b) => b.duration - a.duration)
  // Create a overall flake percentage for the run
  mergedResults.flakePercentage = (
    (flakyTests.length / mergedResults.totalTests) *
    100
  ).toFixed(2)

  // 8. Save the merged results to a file
  fs.writeFileSync(mergedResultsFilePath, JSON.stringify(mergedResults, null, 2))
  console.log(`✅ Merged test results saved at ${mergedResultsFilePath}`)
}

// 9. Call the mergeResults function to execute the script
mergeResults()