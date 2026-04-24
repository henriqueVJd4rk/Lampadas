// script.js - Controle de lâmpadas via MQTT com reconexão automática

let clienteWeb = null
let mqttConectado = false
const clienteId = 'Esp32MFOF_' + Math.random().toString(16).substr(2, 8)

// ===== STATUS UI =====
function setStatus(estado) {
    const dot = document.getElementById('statusDot')
    const txt = document.getElementById('statusTxt')
    if (!dot || !txt) return
    dot.className = 'status-dot ' + estado
    const labels = { online: 'ONLINE', erro: 'ERRO', '': 'CONECTANDO' }
    txt.textContent = labels[estado] || 'CONECTANDO'
}

// ===== MQTT =====
function conectarMQTT() {
    setStatus('')
    clienteWeb = new Paho.MQTT.Client('broker.hivemq.com', 8884, clienteId)

    clienteWeb.onConnectionLost = function(resp) {
        mqttConectado = false
        setStatus('erro')
        // Tenta reconectar após 3s — sem precisar recarregar a página
        setTimeout(conectarMQTT, 3000)
    }

    clienteWeb.connect({
        useSSL: true,
        keepAliveInterval: 30,
        onSuccess: function() {
            mqttConectado = true
            setStatus('online')
            console.log('Conexão MQTT ok')
        },
        onFailure: function() {
            mqttConectado = false
            setStatus('erro')
            // Tenta reconectar após 5s
            setTimeout(conectarMQTT, 5000)
        }
    })
}

conectarMQTT()

// ===== ENVIO MQTT seguro =====
function mqttSend(topic, payload) {
    if (!mqttConectado || !clienteWeb) return
    try {
        const msg = new Paho.MQTT.Message(payload)
        msg.destinationName = topic
        clienteWeb.send(msg)
    } catch(e) {
        console.warn('Falha ao enviar MQTT:', e)
    }
}

// ===== SOM WEB AUDIO =====
// Som "click" ao ligar
function somLigar() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.2)
        osc.onended = () => ctx.close()
    } catch(e) {}
}

// Som "clack" ao desligar
function somDesligar() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'square'
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.18)
        osc.onended = () => ctx.close()
    } catch(e) {}
}

// Som "piscar" (duplo click curto)
function somPiscar() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        ;[0, 0.08].forEach(delay => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'sine'
            osc.frequency.value = 1000
            gain.gain.setValueAtTime(0.12, ctx.currentTime + delay)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.07)
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.08)
        })
        setTimeout(() => ctx.close(), 500)
    } catch(e) {}
}

// ===== SIRENE DE ALARME =====
let sireneAtiva = false
let sireneCtx = null
let sireneOscilador = null

function tocarSirene() {
    if (sireneAtiva) return
    sireneAtiva = true
    sireneCtx = new (window.AudioContext || window.webkitAudioContext)()
    sireneOscilador = sireneCtx.createOscillator()
    const gain = sireneCtx.createGain()
    sireneOscilador.connect(gain)
    gain.connect(sireneCtx.destination)
    sireneOscilador.type = 'sawtooth'
    gain.gain.setValueAtTime(0.3, sireneCtx.currentTime)
    const t = sireneCtx.currentTime
    for (let i = 0; i < 6; i++) {
        sireneOscilador.frequency.linearRampToValueAtTime(i % 2 === 0 ? 1200 : 600, t + 0.5 * (i + 1))
    }
    sireneOscilador.start(t)
    sireneOscilador.stop(t + 3.0)
    sireneOscilador.onended = () => { sireneAtiva = false; sireneCtx.close() }
}

function pararSirene() {
    if (sireneOscilador && sireneAtiva) {
        try { sireneOscilador.stop() } catch(e) {}
        sireneAtiva = false
    }
}

// ===== VIBRAÇÃO =====
function vibrar(ms) { if (navigator.vibrate) navigator.vibrate(ms || 60) }

// ===== AUXILIAR: atualiza card =====
function setCard(id, ligado) {
    const card = document.getElementById('card-' + id)
    const lamp = document.getElementById('lp-' + id)
    if (ligado) {
        lamp.classList.add('acesa')
        card.classList.add('room-on')
    } else {
        lamp.classList.remove('acesa')
        card.classList.remove('room-on')
    }
}

// ===== SALA =====
function ligarLampadaSala() {
    somLigar()
    setCard('sala', true)
    mqttSend('senai510/lampada/sala/ligar', '1')
}
function DesligarLampadaSala() {
    somDesligar()
    setCard('sala', false)
    mqttSend('senai510/lampada/sala/desligar', '0')
}

// ===== COZINHA =====
function ligarLampadaCozinha() {
    somLigar()
    setCard('cozinha', true)
    mqttSend('senai510/lampada/cozinha/ligar', '1')
}
function DesligarLampadaCozinha() {
    somDesligar()
    setCard('cozinha', false)
    mqttSend('senai510/lampada/cozinha/desligar', '0')
}

// ===== QUARTO 1 =====
function ligarLampadaQuarto1() {
    somLigar()
    setCard('quarto1', true)
    mqttSend('senai510/lampada/quarto1/ligar', '1')
}
function DesligarLampadaQuarto1() {
    somDesligar()
    setCard('quarto1', false)
    mqttSend('senai510/lampada/quarto1/desligar', '0')
}

// ===== QUARTO 2 =====
function ligarLampadaQuarto2() {
    somLigar()
    setCard('quarto2', true)
    mqttSend('senai510/lampada/quarto2/ligar', '1')
}
function DesligarLampadaQuarto2() {
    somDesligar()
    setCard('quarto2', false)
    mqttSend('senai510/lampada/quarto2/desligar', '0')
}

// ===== LIGAR / DESLIGAR TODAS =====
// Usa som único (não dispara 4x) e espera um tick entre cada envio MQTT
function ligarTodas() {
    vibrar(60)
    somLigar()
    setCard('sala',    true)
    setCard('cozinha', true)
    setCard('quarto1', true)
    setCard('quarto2', true)
    mqttSend('senai510/lampada/sala/ligar',    '1')
    mqttSend('senai510/lampada/cozinha/ligar', '1')
    mqttSend('senai510/lampada/quarto1/ligar', '1')
    mqttSend('senai510/lampada/quarto2/ligar', '1')
}

function desligarTodas() {
    vibrar(60)
    somDesligar()
    setCard('sala',    false)
    setCard('cozinha', false)
    setCard('quarto1', false)
    setCard('quarto2', false)
    mqttSend('senai510/lampada/sala/desligar',    '0')
    mqttSend('senai510/lampada/cozinha/desligar', '0')
    mqttSend('senai510/lampada/quarto1/desligar', '0')
    mqttSend('senai510/lampada/quarto2/desligar', '0')
}

// ===== PISCAR ALTERNADO =====
let piscarRodando = false

function piscarAlternado() {
    if (piscarRodando) return
    piscarRodando = true
    vibrar(80)
    somPiscar()

    let tempo = 0
    const intervalo = setInterval(() => {
        somPiscar()
        if (tempo % 2 === 0) {
            setCard('sala',    true);  mqttSend('senai510/lampada/sala/ligar',    '1')
            setCard('quarto1', true);  mqttSend('senai510/lampada/quarto1/ligar', '1')
            setCard('cozinha', false); mqttSend('senai510/lampada/cozinha/desligar', '0')
            setCard('quarto2', false); mqttSend('senai510/lampada/quarto2/desligar', '0')
        } else {
            setCard('cozinha', true);  mqttSend('senai510/lampada/cozinha/ligar', '1')
            setCard('quarto2', true);  mqttSend('senai510/lampada/quarto2/ligar', '1')
            setCard('sala',    false); mqttSend('senai510/lampada/sala/desligar',    '0')
            setCard('quarto1', false); mqttSend('senai510/lampada/quarto1/desligar', '0')
        }
        tempo++
    }, 500)

    setTimeout(() => {
        clearInterval(intervalo)
        desligarTodas()
        piscarRodando = false
    }, 5000)
}

// ===== ALARME =====
function ligarAlarme() {
    vibrar(200)
    tocarSirene()
    setCard('sala',    true)
    setCard('cozinha', true)
    setCard('quarto1', true)
    setCard('quarto2', true)

    let flashes = 0
    const flashInterval = setInterval(() => {
        document.body.classList.toggle('alarme-flash')
        flashes++
        if (flashes >= 6) {
            clearInterval(flashInterval)
            document.body.classList.remove('alarme-flash')
        }
    }, 300)

    mqttSend('senai510/alarme/ligar', '1')
}

function desligarAlarme() {
    vibrar(80)
    pararSirene()
    document.body.classList.remove('alarme-flash')
    setCard('sala',    false)
    setCard('cozinha', false)
    setCard('quarto1', false)
    setCard('quarto2', false)
    mqttSend('senai510/alarme/desligar', '0')
}
