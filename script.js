// script.js - Controle de lâmpadas via MQTT
// Biblioteca: Paho MQTT (carregada no HTML via CDN)

let clienteWeb = null
const clienteId = 'Esp32MFOF'

clienteWeb = new Paho.MQTT.Client(
    'broker.hivemq.com',
    8884,
    clienteId
)

clienteWeb.connect({
    useSSL: true,
    onSuccess: function () {
        console.log('Conexão MQTT ok')
    },
    onFailure: function () {
        alert('Conexão MQTT falhou. Verifique sua internet.')
    }
})


// ===== SALA =====

function ligarLampadaSala() {
    document.getElementById('lp-sala')
        .classList.add('acesa')

    const msg = new Paho.MQTT.Message('1')
    msg.destinationName = 'senai510/lampada/sala/ligar'
    clienteWeb.send(msg)
}

function DesligarLampadaSala() {
    document.getElementById('lp-sala')
        .classList.remove('acesa')

    const msg = new Paho.MQTT.Message('0')
    msg.destinationName = 'senai510/lampada/sala/desligar'
    clienteWeb.send(msg)
}


// ===== COZINHA =====

function ligarLampadaCozinha() {
    document.getElementById('lp-cozinha')
        .classList.add('acesa')

    const msg = new Paho.MQTT.Message('1')
    msg.destinationName = 'senai510/lampada/cozinha/ligar'
    clienteWeb.send(msg)
}

function DesligarLampadaCozinha() {
    document.getElementById('lp-cozinha')
        .classList.remove('acesa')

    const msg = new Paho.MQTT.Message('0')
    msg.destinationName = 'senai510/lampada/cozinha/desligar'
    clienteWeb.send(msg)
}


// ===== QUARTO 1 =====

function ligarLampadaQuarto1() {
    document.getElementById('lp-quarto1')
        .classList.add('acesa')

    const msg = new Paho.MQTT.Message('1')
    msg.destinationName = 'senai510/lampada/quarto1/ligar'
    clienteWeb.send(msg)
}

function DesligarLampadaQuarto1() {
    document.getElementById('lp-quarto1')
        .classList.remove('acesa')

    const msg = new Paho.MQTT.Message('0')
    msg.destinationName = 'senai510/lampada/quarto1/desligar'
    clienteWeb.send(msg)
}


// ===== QUARTO 2 =====

function ligarLampadaQuarto2() {
    document.getElementById('lp-quarto2')
        .classList.add('acesa')

    const msg = new Paho.MQTT.Message('1')
    msg.destinationName = 'senai510/lampada/quarto2/ligar'
    clienteWeb.send(msg)
}

function DesligarLampadaQuarto2() {
    document.getElementById('lp-quarto2')
        .classList.remove('acesa')

    const msg = new Paho.MQTT.Message('0')
    msg.destinationName = 'senai510/lampada/quarto2/desligar'
    clienteWeb.send(msg)
}
