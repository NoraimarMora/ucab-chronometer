const MAX_LAPS = 2;
const MAX_STOPS = 2;
let laps = 0;
let lap_time = 0;
let stops = 0;
let timer = 0;
let timer_aux = 0;

$(document).ready(function () {
    const connectButton = $('#connectButton');
    let port;
    let reader;
    let writer;
    let decoder = new TextDecoder();
    let encoder = new TextEncoder();

    // Función para escribir mensajes en la consola de la demo y en la del navegador
    function logMessage(message) {
        console.log(message);
    }

    // Comprobar si la Web Serial API es compatible
    if ('serial' in navigator) {
        logMessage('Web Serial API soportada en este navegador.', 'success');
        connectButton.prop('disabled', false);
    } else {
        logMessage('Error: Web Serial API NO soportada. Por favor, usa Chrome/Edge.', 'error');
        connectButton.prop('disabled', true);
        return;
    }

    // --- Funciones de Conexión y Lectura ---
    async function connectSerial() {
        try {
            port = await navigator.serial.requestPort({
                filters: [
                    { usbVendorId: 0x2341, usbProductId: 0x0043 },
                    { usbVendorId: 0x2341, usbProductId: 0x0001 }
                ]
             });
            await port.open({ baudRate: 19200 });

            console.log('Conectado a ' + port.getInfo().usbProductId + ' / ' + port.getInfo().usbVendorId);
            logMessage('Conectado al puerto serie.', 'success');

            // Habilitar/deshabilitar botones con .prop()
            connectButton.prop('disabled', true);

            reader = port.readable.getReader();
            writer = port.writable.getWriter();
            stops = 0;
            laps = 0;
            readLoop();

        } catch (error) {
            logMessage('Error al conectar: ' + error.message, 'error');
        }
    }

    async function readLoop() {
        while (true) {
            try {
                const { value, done } = await reader.read();
                if (done) {
                    logMessage('Lector liberado.', 'warning');
                    break;
                }
                if (laps < 2 || stops < 2) {
                    // disconnectSerial(); // Desconectar si se alcanzan los límites
                    const receivedData = decoder.decode(value);
                    process_data(receivedData);
                } else {
                    break;
                }

            } catch (error) {
                logMessage('Error durante la lectura: ' + error.message, 'error');
                break;
            }
        }
    }

    async function disconnectSerial() {
        if (reader) {
            await reader.cancel();
            reader.releaseLock();
            reader = null;
        }
        if (writer) {
            writer.releaseLock();
            writer = null;
        }
        if (port) {
            await port.close();
            port = null;
        }

        logMessage('Puerto serie desconectado.', 'info');
    }

    // --- Event Listeners con jQuery ---
    connectButton.on('click', connectSerial);

    // Evento para cuando el puerto se desconecta inesperadamente (sin cambios, es API nativa)
    navigator.serial.addEventListener('disconnect', (event) => {
        if (port && event.port === port) {
            logMessage('¡El dispositivo se ha desconectado físicamente!', 'warning');
            disconnectSerial();
        }
    });

    $('#change-robot').on('click', function () {
        let robot = parseInt($('#robots').val());
        $('#robot-name').text(robots[robot].name);
        $('#school-logo').attr('src', robots[robot].logo);
    });
});

function proccess_timer(display, timer) {
    let milliseconds = timer % 1000;
    let totalSeconds = Math.floor(timer / 1000);
    let seconds = totalSeconds % 60;
    let minutes = Math.floor(totalSeconds / 60);

    let displayMinutes = minutes < 10 ? "0" + minutes : minutes;
    let displaySeconds = seconds < 10 ? "0" + seconds : seconds;
    let displayMilliseconds = (Math.trunc(milliseconds / 10)) < 10 ? "0" + (Math.trunc(milliseconds / 10)) : (Math.trunc(milliseconds / 10));

    $(display).text(displayMinutes + ":" + displaySeconds + "." + displayMilliseconds);
}

function process_data(data) {
    if (data.includes("Stop") || data.includes("top")) {
        stops++;
        console.log("Stop count:", stops);

        if (stops == MAX_STOPS) {
            $("#clock span").text("00:00.00");
            for (let i = 0; i < MAX_LAPS; i++) {
                $($(".lap-data .time")[i]).text("--:--.--");
                $($(".lap-data .total")[i]).text("--:--.--");
            }

            stops = 0;
            laps = 0;
            lap_time = 0;
            timer = 0;
            timer_aux = 0;
            return;
        }
    }

    if (laps == MAX_LAPS) {
        return;
    }

    if (data.includes("Start") || data.includes("art")) {
        stops = 0;
        laps = 0;
        lap_time = 0;
        timer = 0;
        timer_aux = 0;
        
        $("#clock span").text("00:00.00");
        return;
    }
    
    if (data.includes("Lap") || data.includes("La") || data.includes("ap")) {
        proccess_timer($(".lap-data .time")[laps], lap_time);
        proccess_timer($(".lap-data .total")[laps], timer);

        laps++;
        if (laps == MAX_LAPS) {
            proccess_timer($("#clock span"), timer);
        }

        lap_time = 0;
    }
    
    if (laps < MAX_LAPS) {
        timer += 4.1;
        timer_aux += 4.1;
        lap_time += 4.1;

        if (timer_aux >= 50) {
            proccess_timer($("#clock span"), timer);
            timer_aux = 0;
        }
    }	
}

const robots = [
    {
        name: "StormRunner",
        logo: "img/logo-nazaret.png"
    },
    {
        name: "Turb0",
        logo: "img/logo-loyola.png"
    },
    {
        name: "Dragonforce",
        logo: "img/logo-montesacro.png"
    },
    {
        name: "Flash",
        logo: "img/logo-montesacro.png"
    },
    {
        name: "MOS Thunderbolt",
        logo: "img/logo-cimos.png"
    },
    {
        name: "Mcqueen",
        logo: "img/logo-jesusobrero.png"
    },
    {
        name: "TurboRacer",
        logo: "img/logo-losproceres.png"
    },
    {
        name: "VELOCIRAPTOR",
        logo: "img/logo-lourdes.png"
    },
    {
        name: "Hoppy",
        logo: "img/logo-feyalegria.png"
    },
    {
        name: "Hopebot",
        logo: "img/logo-feyalegria.png"
    },
    {
        name: "Kratos",
        logo: "img/logo-feyalegria.png"
    }
];