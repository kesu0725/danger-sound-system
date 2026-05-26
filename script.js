const startButton =
    document.getElementById("startButton");

const stopButton =
    document.getElementById("stopButton");

const confirmButton =
    document.getElementById("confirmButton");

const volumeText =
    document.getElementById("volume");

const meter =
    document.getElementById("meter");

const statusText =
    document.getElementById("status");

let animationId;

let stream;

let isRunning = false;

let warningActive = false;

// 위험 시작 시간
let dangerStartTime = null;

// 시작 버튼
startButton.addEventListener("click", startAudio);

// 중지 버튼
stopButton.addEventListener("click", stopAudio);

// 확인 버튼
confirmButton.addEventListener("click", resetWarning);

async function startAudio() {

    if (isRunning) return;

    isRunning = true;

    stream =
        await navigator.mediaDevices.getUserMedia({
            audio: true
        });

    const audioContext =
        new AudioContext();

    const analyser =
        audioContext.createAnalyser();

    const microphone =
        audioContext.createMediaStreamSource(stream);

    microphone.connect(analyser);

    analyser.fftSize = 2048;

    const dataArray =
        new Uint8Array(analyser.fftSize);

    function update() {

        // 경고 중이면 감지 중단
        if (warningActive) return;

        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;

        for (let i = 0; i < dataArray.length; i++) {

            let value =
                (dataArray[i] - 128) / 128;

            sum += value * value;
        }

        let volume =
            Math.sqrt(sum / dataArray.length);

        volumeText.textContent =
            "현재 소리 크기: " +
            volume.toFixed(3);

         // 게이지 업데이트
         let meterValue = volume * 500;
         if (meterValue > 100) {
             meterValue = 100;
            }
            meter.style.width =
            meterValue + "%";
            
        // 색상 변경
        if (meterValue < 40) {
            meter.style.backgroundColor =
                 "green";
        } else if (meterValue < 70) {

    meter.style.backgroundColor =
        "orange";

        } else {

            meter.style.backgroundColor =
                "red";
        }   // 미터 표시

        // 위험 기준
        if (volume > 0.10) {

            // 처음 위험 감지 시 시간 기록
            if (dangerStartTime === null) {

                dangerStartTime =
                    Date.now();
            }

            // 0.5초 이상 지속되면
            else if (
                Date.now() - dangerStartTime
                > 500
            ) {

                triggerWarning();
            }

        } else {

            // 위험 끊기면 초기화
            dangerStartTime = null;
        }

        animationId =
            requestAnimationFrame(update);
    }

    update();
}

// 경고 발생
function triggerWarning() {

    warningActive = true;

    document.body.style.backgroundColor =
        "red";

    statusText.textContent =
        "⚠ 위험 소음 감지!";

    statusText.style.color =
        "white";

    // 진동
    if (navigator.vibrate) {

        navigator.vibrate([1000, 500, 1000]);
    }

    // 확인 버튼 표시
    confirmButton.style.display =
        "inline-block";
}

// 확인 버튼 누르면 복귀
function resetWarning() {

    warningActive = false;

    dangerStartTime = null;

    document.body.style.backgroundColor =
        "white";

    statusText.textContent =
        "정상 상태";

    statusText.style.color =
        "black";

    confirmButton.style.display =
        "none";

    // 다시 감지 가능 상태로 변경
    isRunning = false;

    // 감지 재시작
    startAudio();
}

// 중지 버튼
function stopAudio() {

    isRunning = false;

    cancelAnimationFrame(animationId);

    if (stream) {

        stream.getTracks().forEach(track => {

            track.stop();
        });
    }

    document.body.style.backgroundColor =
        "white";

    statusText.textContent =
        "중지됨";

    statusText.style.color =
        "black";

    volumeText.textContent =
        "현재 소리 크기: 0";

    confirmButton.style.display =
        "none";

    warningActive = false;

    dangerStartTime = null;
}
