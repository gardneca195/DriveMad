/*  Drive Mad — Automated Level Tester
    Inject into the running game page to auto-drive every level.
    Holds gas, retries on crash, reports pass/fail per level.

    Usage (via preview_eval or browser console):
      fetch('test-levels.js').then(r=>r.text()).then(eval)

    Or paste directly into the console.
*/
(function(){
  var MAX_RETRIES = 5;
  var TIMEOUT_SEC = 20;
  var results = [];
  var totalLevels = LEVELS.length;
  var currentTest = 0;

  function log(msg){ console.log('[TEST] ' + msg); }

  function testLevel(idx){
    if(idx >= totalLevels){
      printReport();
      return;
    }
    currentTest = idx;
    var attempt = 0;

    function tryLevel(){
      attempt++;
      log('Level ' + (idx+1) + ' attempt ' + attempt + '/' + MAX_RETRIES);

      /* load the level */
      level = idx;
      tries = 0;
      loadLevel(idx);

      /* simulate holding gas */
      input.gas = true;
      input.brake = false;

      var startTime = performance.now();
      var checkInterval = setInterval(function(){
        var elapsed_ms = performance.now() - startTime;

        /* update HUD so time displays */
        if(running && !ended){
          elapsed = (performance.now() - t0) / 1000;
          hud();
        }

        if(ended){
          clearInterval(checkInterval);
          input.gas = false;

          if(progress[idx] !== undefined){
            /* won! */
            log('Level ' + (idx+1) + ' PASSED (attempt ' + attempt + ', ' + elapsed.toFixed(1) + 's)');
            results.push({level: idx+1, status: 'PASS', attempts: attempt, time: elapsed.toFixed(1)});
            setTimeout(function(){ testLevel(idx+1); }, 200);
          } else {
            /* crashed */
            if(attempt < MAX_RETRIES){
              log('Level ' + (idx+1) + ' crashed, retrying...');
              setTimeout(tryLevel, 200);
            } else {
              log('Level ' + (idx+1) + ' FAILED after ' + MAX_RETRIES + ' attempts');
              results.push({level: idx+1, status: 'FAIL', attempts: attempt, time: '-'});
              setTimeout(function(){ testLevel(idx+1); }, 200);
            }
          }
          return;
        }

        /* timeout — car is stuck or going nowhere */
        if(elapsed_ms > TIMEOUT_SEC * 1000){
          clearInterval(checkInterval);
          input.gas = false;
          running = false;
          ended = true;
          if(attempt < MAX_RETRIES){
            log('Level ' + (idx+1) + ' timed out, retrying...');
            setTimeout(tryLevel, 200);
          } else {
            log('Level ' + (idx+1) + ' TIMEOUT after ' + MAX_RETRIES + ' attempts');
            results.push({level: idx+1, status: 'TIMEOUT', attempts: attempt, time: '>'+TIMEOUT_SEC});
            setTimeout(function(){ testLevel(idx+1); }, 200);
          }
        }
      }, 100);
    }

    tryLevel();
  }

  function printReport(){
    log('═══════════════════════════════════');
    log('  DRIVE MAD TEST REPORT');
    log('═══════════════════════════════════');
    var passed=0, failed=0, timedOut=0;
    for(var i=0;i<results.length;i++){
      var r = results[i];
      var icon = r.status==='PASS' ? 'OK' : r.status==='FAIL' ? 'XX' : 'TO';
      log('[' + icon + '] Level ' + r.level + ' — ' + r.status +
          ' (attempts: ' + r.attempts + ', time: ' + r.time + 's)');
      if(r.status==='PASS') passed++;
      else if(r.status==='FAIL') failed++;
      else timedOut++;
    }
    log('───────────────────────────────────');
    log('Passed: ' + passed + '/' + totalLevels);
    log('Failed: ' + failed);
    log('Timed out: ' + timedOut);
    log('═══════════════════════════════════');

    /* expose results globally for programmatic access */
    window._testResults = results;
    window._testSummary = {passed:passed, failed:failed, timedOut:timedOut, total:totalLevels};
  }

  /* hide menu if visible */
  document.getElementById('menu').classList.add('hide');
  document.getElementById('end').classList.add('hide');

  log('Starting automated test of ' + totalLevels + ' levels...');
  log('Max retries per level: ' + MAX_RETRIES);
  log('Timeout per attempt: ' + TIMEOUT_SEC + 's');
  testLevel(0);
})();
