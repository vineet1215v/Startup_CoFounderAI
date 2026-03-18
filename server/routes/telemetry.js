const express = require('express');
const router = express.Router();

// Real-time telemetry generator
router.get('/telemetry', (req, res) => {
    res.json({
        neuralLoad: (40 + Math.random() * 5).toFixed(1) + " TFLOPs",
        synapticSpeed: (1.0 + Math.random() * 0.5).toFixed(1) + "ms",
        simulationAccuracy: (99.5 + Math.random() * 0.4).toFixed(1) + "%",
        activeStreams: 5,
        conviction: 80 + Math.floor(Math.random() * 15)
    });
});

router.get('/insights', (req, res) => {
    const insights = [
        { id: 1, text: 'Neural pathways optimized for ' + (Math.random() > 0.5 ? 'scalability' : 'growth'), time: 'Just now', type: 'system' },
        { id: 2, text: 'Market sentiment shifting towards AI automation', time: '5m ago', type: 'market' },
        { id: 3, text: 'Boardroom consensus reached on V1 roadmap', time: '12m ago', type: 'agent' }
    ];
    res.json(insights);
});

router.get('/streams', (req, res) => {
    const streams = [
        { name: 'Core Infrastructure', progress: 65 + Math.floor(Math.random() * 10), agent: 'CTO', color: '#3b82f6' },
        { name: 'Influencer Discovery', progress: 40 + Math.floor(Math.random() * 15), agent: 'CMO', color: '#ec4899' },
        { name: 'Retention Algorithms', progress: 20 + Math.floor(Math.random() * 20), agent: 'CPO', color: '#8b5cf6' },
        { name: 'Financial scenario v2', progress: 85 + Math.floor(Math.random() * 10), agent: 'CFO', color: '#eab308' },
        { name: 'Backend Assembly', progress: 50 + Math.floor(Math.random() * 15), agent: 'COO', color: '#10b981' },
    ];
    res.json(streams);
});

module.exports = router;
