// Data storage
let departmentsData = {};
let regionsData = {};
let genderStats = {};
let candidateStats = {};
let deptSortMode = 'gap-desc'; // 'gap-desc', 'gap-asc', 'alpha'
let regionSortMode = 'gap-desc';
let lockedDept = null;
let lockedRegion = null;
let deptElements = {}; // Store D3 selections for highlighting
let regionElements = {};

async function init() {
    await loadData();
    populateDepartmentList();
    populateRegionList();
    renderGenderCharts();
    renderCandidateCharts();
    await createMaps();
}

async function loadData() {
    try {
        console.log('Loading departments data...');
        const deptResponse = await fetch('departments_data.json');
        if (!deptResponse.ok) throw new Error(`HTTP ${deptResponse.status}`);
        departmentsData = (await deptResponse.json()).departments;
        console.log(`Loaded ${Object.keys(departmentsData).length} departments`);

        console.log('Loading regions data...');
        const regResponse = await fetch('regions_data.json');
        if (!regResponse.ok) throw new Error(`HTTP ${regResponse.status}`);
        regionsData = (await regResponse.json()).regions;
        console.log(`Loaded ${Object.keys(regionsData).length} regions`);

        console.log('Loading gender stats...');
        const genderResponse = await fetch('gender_stats.json');
        if (!genderResponse.ok) throw new Error(`HTTP ${genderResponse.status}`);
        genderStats = (await genderResponse.json()).stats;
        console.log('Loaded gender statistics');

        const candidateResponse = await fetch('candidate_stats.json');
        if (!candidateResponse.ok) throw new Error(`HTTP ${candidateResponse.status}`);
        candidateStats = await candidateResponse.json();
    } catch (error) {
        console.error('Error loading data:', error);
        document.querySelectorAll('#gender-charts, #age-charts, #first-out-charts').forEach(container => {
            container.textContent = 'Impossible de charger les données. Vérifiez que les fichiers JSON sont disponibles.';
        });
        throw error;
    }
}

function getColor(gap, candidates, isRegion = false) {
    if (candidates === 0) return '#ffffff';
    
    if (isRegion) {
        if (gap > 1.5) return '#1a9850';
        if (gap > 0.75) return '#66bd63';
        if (gap >= 0) return '#b1d582';
        if (gap > -0.75) return '#d9ef8b';
        if (gap > -1.5) return '#fee08b';
        return '#d73027';
    } else {
        if (gap > 1) return '#1a9850';
        if (gap > 0.5) return '#66bd63';
        if (gap >= 0) return '#b1d582';
        if (gap > -0.5) return '#d9ef8b';
        if (gap > -1) return '#fee08b';
        return '#d73027';
    }
}

// Sort menu functions
function toggleDeptSortMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('dept-sort-menu');
    menu.classList.toggle('open');
    document.addEventListener('click', closeDeptSortMenu);
}

function closeDeptSortMenu() {
    document.getElementById('dept-sort-menu').classList.remove('open');
    document.removeEventListener('click', closeDeptSortMenu);
}

function setDeptSort(mode) {
    deptSortMode = mode;
    
    // Update label
    const labels = { 'gap-desc': 'Gap ↓', 'gap-asc': 'Gap ↑', 'alpha': 'A → Z' };
    document.getElementById('dept-sort-label').textContent = labels[mode];
    
    // Update menu
    document.querySelectorAll('#dept-sort-menu .sort-item').forEach((item, idx) => {
        item.classList.remove('active');
        if ((mode === 'gap-desc' && idx === 0) ||
            (mode === 'gap-asc' && idx === 1) ||
            (mode === 'alpha' && idx === 2)) {
            item.classList.add('active');
        }
    });
    
    closeDeptSortMenu();
    populateDepartmentList();
}

function toggleRegionSortMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('region-sort-menu');
    menu.classList.toggle('open');
    document.addEventListener('click', closeRegionSortMenu);
}

function closeRegionSortMenu() {
    document.getElementById('region-sort-menu').classList.remove('open');
    document.removeEventListener('click', closeRegionSortMenu);
}

function setRegionSort(mode) {
    regionSortMode = mode;
    
    // Update label
    const labels = { 'gap-desc': 'Gap ↓', 'gap-asc': 'Gap ↑', 'alpha': 'A → Z' };
    document.getElementById('region-sort-label').textContent = labels[mode];
    
    // Update menu
    document.querySelectorAll('#region-sort-menu .sort-item').forEach((item, idx) => {
        item.classList.remove('active');
        if ((mode === 'gap-desc' && idx === 0) ||
            (mode === 'gap-asc' && idx === 1) ||
            (mode === 'alpha' && idx === 2)) {
            item.classList.add('active');
        }
    });
    
    closeRegionSortMenu();
    populateRegionList();
}

function sortData(entries, mode) {
    if (mode === 'gap-desc') {
        return entries.sort((a, b) => b[1].gap_percentage - a[1].gap_percentage);
    } else if (mode === 'gap-asc') {
        return entries.sort((a, b) => a[1].gap_percentage - b[1].gap_percentage);
    } else if (mode === 'alpha') {
        return entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
    return entries;
}

function populateDepartmentList() {
    const list = document.getElementById('dept-list');
    let depts = Object.entries(departmentsData);
    
    depts = sortData(depts, deptSortMode);
    
    let html = '';
    for (const [name, data] of depts) {
        const color = getColor(data.gap_percentage, data.candidate_count);
        const isLocked = lockedDept === name;
        html += `
            <div class="dept-item ${isLocked ? 'locked' : ''}" onclick="selectDept(event, '${name.replace(/'/g, "\\'")}')">
                <div>
                    <div class="dept-name">${name}</div>
                    <div class="dept-gap">Gap: ${data.gap_percentage > 0 ? '+' : ''}${data.gap_percentage}%</div>
                </div>
                <div class="dept-color" style="background: ${color};"></div>
            </div>
        `;
    }
    list.innerHTML = html;
}

function populateRegionList() {
    const list = document.getElementById('region-list');
    let regions = Object.entries(regionsData);
    
    regions = sortData(regions, regionSortMode);
    
    let html = '';
    for (const [name, data] of regions) {
        const color = getColor(data.gap_percentage, data.candidate_count, true);
        const isLocked = lockedRegion === name;
        html += `
            <div class="dept-item ${isLocked ? 'locked' : ''}" onclick="selectRegion(event, '${name.replace(/'/g, "\\'")}')">
                <div>
                    <div class="dept-name">${name}</div>
                    <div class="dept-gap">Gap: ${data.gap_percentage > 0 ? '+' : ''}${data.gap_percentage}%</div>
                </div>
                <div class="dept-color" style="background: ${color};"></div>
            </div>
        `;
    }
    list.innerHTML = html;
}

function selectDept(event, name) {
    event.stopPropagation();
    lockedDept = lockedDept === name ? null : name;
    showDeptInfo(name);
    highlightDeptOnMap(name);
    populateDepartmentList();
}

function selectRegion(event, name) {
    event.stopPropagation();
    lockedRegion = lockedRegion === name ? null : name;
    showRegionInfo(name);
    highlightRegionOnMap(name);
    populateRegionList();
}

function showDeptInfo(name) {
    const data = departmentsData[name];
    if (!data) return;

    let html = `${lockedDept === name ? '<div class="locked-label">📌 VERROUILLÉ - Cliquer pour déverrouiller</div>' : ''}
        <div class="info-row">
            <span class="label">Département:</span>
            <span class="value"><strong>${name}</strong></span>
        </div>
        <div class="info-row">
            <span class="label">Population:</span>
            <span class="value">${data.population_percentage}%</span>
        </div>
        <div class="info-row">
            <span class="label">Candidats:</span>
            <span class="value">${data.candidate_count}</span>
        </div>
        <div class="info-row">
            <span class="label">% Candidats:</span>
            <span class="value">${data.candidate_percentage}%</span>
        </div>
        <div class="info-row">
            <span class="label">Gap:</span>
            <span class="value" style="color: ${data.gap_percentage > 0 ? '#d73027' : '#4575b4'}; font-weight: bold;">
                ${data.gap_percentage > 0 ? '+' : ''}${data.gap_percentage}%
            </span>
        </div>
    `;

    if (data.candidates && data.candidates.length > 0) {
        html += `
            <div class="candidates-list">
                <h4>Candidats (${data.candidates.length})</h4>
                ${data.candidates.map(c => `<div class="candidate-name">• ${typeof c === 'object' ? c.name + ' (' + c.season + ')' : c}</div>`).join('')}
            </div>
        `;
    }

    document.getElementById('dept-info').innerHTML = html;
}

function showRegionInfo(name) {
    const data = regionsData[name];
    if (!data) return;

    let html = `${lockedRegion === name ? '<div class="locked-label">📌 VERROUILLÉ - Cliquer pour déverrouiller</div>' : ''}
        <div class="info-row">
            <span class="label">Région:</span>
            <span class="value"><strong>${name}</strong></span>
        </div>
        <div class="info-row">
            <span class="label">Population:</span>
            <span class="value">${data.population_percentage}%</span>
        </div>
        <div class="info-row">
            <span class="label">Candidats:</span>
            <span class="value">${data.candidate_count}</span>
        </div>
        <div class="info-row">
            <span class="label">% Candidats:</span>
            <span class="value">${data.candidate_percentage}%</span>
        </div>
        <div class="info-row">
            <span class="label">Gap:</span>
            <span class="value" style="color: ${data.gap_percentage > 0 ? '#d73027' : '#4575b4'}; font-weight: bold;">
                ${data.gap_percentage > 0 ? '+' : ''}${data.gap_percentage}%
            </span>
        </div>
    `;

    if (data.candidates && data.candidates.length > 0) {
        html += `
            <div class="candidates-list">
                <h4>Candidats (${data.candidates.length})</h4>
                ${data.candidates.map(c => `<div class="candidate-name">• ${typeof c === 'object' ? c.name + ' (' + c.season + ')' : c}</div>`).join('')}
            </div>
        `;
    }

    document.getElementById('region-info').innerHTML = html;
}

function highlightDeptOnMap(name) {
    // Remove highlight from all
    d3.selectAll('.department').classed('highlighted-region', false);
    // Add highlight to selected
    if (lockedDept) {
        d3.selectAll('.department').filter(d => d.properties.nom === lockedDept).classed('highlighted-region', true);
    }
}

function highlightRegionOnMap(name) {
    // Remove highlight from all
    d3.selectAll('.region').classed('highlighted-region', false);
    // Add highlight to selected
    if (lockedRegion) {
        d3.selectAll('.region').filter(d => d.properties.nom === lockedRegion).classed('highlighted-region', true);
    }
}

async function createMaps() {
    await createDeptMap();
    await createRegionMap();
    await createTribeMaps();
}

const TRIBE_COLORS = {
    Bleu: '#00C2D1',
    Orange: '#FE7F2D',
    Vert: '#6DA34D',
    Violet: '#827191'
};

const GENDER_COLORS = { F: '#1b998b', H: '#58355e' };

function ensureDefs(svg) {
    let defs = svg.select('defs');
    return defs.empty() ? svg.append('defs') : defs;
}

function hatchPattern(defs, colors) {
    const id = `hatch-${colors.join('-')}`;
    if (!defs.select(`#${id}`).empty()) return `url(#${id})`;
    const size = 6;
    const stripe = size / colors.length;
    const pattern = defs.append('pattern')
        .attr('id', id)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', size)
        .attr('height', size)
        .attr('patternTransform', 'rotate(45)');
    colors.forEach((c, i) => {
        pattern.append('rect')
            .attr('x', i * stripe).attr('y', 0)
            .attr('width', stripe).attr('height', size)
            .attr('fill', TRIBE_COLORS[c]);
    });
    return `url(#${id})`;
}

function dotPattern(defs, color) {
    const id = `dots-${color}`;
    if (!defs.select(`#${id}`).empty()) return `url(#${id})`;
    const pattern = defs.append('pattern')
        .attr('id', id)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 6)
        .attr('height', 6);
    pattern.append('rect').attr('width', 6).attr('height', 6).attr('fill', '#ffffff');
    pattern.append('circle').attr('cx', 3).attr('cy', 3).attr('r', 1.5).attr('fill', TRIBE_COLORS[color]);
    return `url(#${id})`;
}

async function createTribeMaps() {
    try {
        const [tribes, deptGeo, regGeo] = await Promise.all([
            fetch('tribes_data.json').then(r => r.json()),
            fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson').then(r => r.json()),
            fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson').then(r => r.json())
        ]);

        renderTribeMap('map-tribe-dept', deptGeo, (name, defs) => {
            const info = tribes.departments[name];
            if (!info) return '#cccccc';
            if (info.colors.length === 1) return TRIBE_COLORS[info.colors[0]];
            if (info.colors.length > 1) return hatchPattern(defs, info.colors);
            return info.fallback ? dotPattern(defs, info.fallback) : '#ffffff';
        });

        renderTribeMap('map-tribe-region', regGeo, (name, defs) => {
            const colors = tribes.regions[name] || [];
            if (colors.length === 0) return '#ffffff';
            if (colors.length === 1) return TRIBE_COLORS[colors[0]];
            return hatchPattern(defs, colors);
        });
    } catch (error) {
        console.error('Error loading tribe maps:', error);
    }
}

function renderTribeMap(containerId, geojson, fillFn) {
    const container = document.getElementById(containerId);
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    const defs = ensureDefs(svg);

    const projection = d3.geoMercator().fitSize([width, height], geojson);
    const pathGen = d3.geoPath().projection(projection);
    const g = svg.append('g');

    g.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', pathGen)
        .attr('fill', d => fillFn(d.properties.nom, defs))
        .attr('stroke', '#666')
        .attr('stroke-width', 0.5)
        .append('title')
        .text(d => d.properties.nom);

    svg.call(d3.zoom().on('zoom', (event) => g.attr('transform', event.transform)));
}

async function createDeptMap() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson');
        const geojson = await response.json();
        renderMap('map-dept', geojson, 'department');
    } catch (error) {
        console.error('Error loading dept map:', error);
    }
}

async function createRegionMap() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson');
        const geojson = await response.json();
        renderMap('map-region', geojson, 'region');
    } catch (error) {
        console.error('Error loading region map:', error);
    }
}

function renderMap(containerId, geojson, type) {
    const container = document.getElementById(containerId);
    const width = container.clientWidth;
    const height = container.clientHeight;

    console.log(`Rendering ${type} map, ${geojson.features.length} features`);

    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const projection = d3.geoMercator().fitSize([width, height], geojson);
    const pathGen = d3.geoPath().projection(projection);

    const g = svg.append('g');

    let coloredCount = 0;
    let greyCount = 0;

    g.selectAll(`.${type}`)
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('class', type)
        .attr('d', pathGen)
        .attr('fill', (d) => {
            const dataSource = type === 'department' ? departmentsData : regionsData;
            const name = d.properties.nom;
            const data = dataSource[name];
            
            if (!data) {
                greyCount++;
                console.warn(`No data for ${type}: ${name}`);
                return '#cccccc';
            }
            
            coloredCount++;
            const isRegion = type === 'region';
            const color = getColor(data.gap_percentage, data.candidate_count, isRegion);
            return color;
        })
        .on('click', function(event, d) {
            event.stopPropagation();
            if (type === 'department') {
                selectDept(event, d.properties.nom);
            } else {
                selectRegion(event, d.properties.nom);
            }
        })
        .on('mouseover', function(event, d) {
            if (type === 'department' && lockedDept) {
                // Don't show hover when locked
                return;
            }
            if (type === 'region' && lockedRegion) {
                // Don't show hover when locked
                return;
            }
            
            d3.select(this).style('stroke', '#2d7d4f').style('stroke-width', '1.5px');
            if (type === 'department') {
                showDeptInfo(d.properties.nom);
            } else {
                showRegionInfo(d.properties.nom);
            }
        })
        .on('mouseout', function() {
            d3.select(this).style('stroke', '#999').style('stroke-width', '0.5px');
            if (type === 'department' && lockedDept) {
                showDeptInfo(lockedDept);
            } else if (type === 'region' && lockedRegion) {
                showRegionInfo(lockedRegion);
            }
        });

    console.log(`${type} map: ${coloredCount} colored, ${greyCount} grey`);

    const zoom = d3.zoom().on('zoom', (event) => {
        g.attr('transform', event.transform);
    });

    svg.call(zoom);
}

function renderGenderCharts() {
    const container = document.getElementById('gender-charts');
    if (!container || !genderStats || Object.keys(genderStats).length === 0) {
        console.warn('Cannot render gender charts');
        return;
    }

    const chartDefinitions = [
        {
            key: 'overall',
            title: 'Ensemble des candidats',
            subtitle: '(tous les candidats et candidates)'
        },
        {
            key: 'ori',
            title: 'Orientation',
            subtitle: '(où ORI? == Oui)'
        },
        {
            key: 'pot',
            title: 'Les Poteaux',
            subtitle: '(où POT? == Oui)'
        },
        {
            key: 'place',
            title: 'Finalistes',
            subtitle: '(où PLACE == 1)'
        }
    ];

    chartDefinitions.forEach(def => {
        const stats = genderStats[def.key];
        if (!stats) return;

        const chart = document.createElement('div');
        chart.className = 'gender-chart';
        
        const h = stats.H || 0;
        const f = stats.F || 0;
        const total = stats.total || 0;
        
        const hPercent = total > 0 ? ((h / total) * 100).toFixed(1) : 0;
        const fPercent = total > 0 ? ((f / total) * 100).toFixed(1) : 0;
        
        // Calculate bar heights (max height = 150px, min = 10px)
        const maxValue = Math.max(h, f, 1);
        const hHeight = Math.max(10, (h / maxValue) * 150);
        const fHeight = Math.max(10, (f / maxValue) * 150);
        
        chart.innerHTML = `
            <h3>${def.title}</h3>
            <p style="font-size: 0.85em; color: #999; margin-bottom: 10px;">${def.subtitle}</p>
            <div class="chart-bars">
                <div class="bar-container">
                    <div class="bar" style="height: ${hHeight}px;"></div>
                    <div class="bar-label">Hommes</div>
                    <div class="bar-count">${h}</div>
                </div>
                <div class="bar-container">
                    <div class="bar female" style="height: ${fHeight}px;"></div>
                    <div class="bar-label">Femmes</div>
                    <div class="bar-count">${f}</div>
                </div>
            </div>
            <div class="chart-stats">
                <div>
                    <span>Hommes:</span>
                    <strong>${hPercent}%</strong>
                </div>
                <div>
                    <span>Femmes:</span>
                    <strong>${fPercent}%</strong>
                </div>
                <div style="border-top: 1px solid #ddd; margin-top: 8px; padding-top: 8px;">
                    <span>Total:</span>
                    <strong>${total} candidat${total > 1 ? 's' : ''}</strong>
                </div>
            </div>
        `;
        
        container.appendChild(chart);
    });
}

function renderCandidateCharts() {
    const ages = document.getElementById('age-charts');
    renderAgeChart(ages, 'Âge de tous les candidats', candidateStats.ages.all, candidateStats.age_candidates.all);
    renderAgeChart(ages, "Âge des candidats ayant atteint l'épreuve d'orientation", candidateStats.ages.orientation, candidateStats.age_candidates.orientation);

    const firstOuts = candidateStats.first_outs;
    const charts = document.getElementById('first-out-charts');
    const genderEntries = [
        { label: 'Femmes', value: firstOuts.gender.F, color: GENDER_COLORS.F },
        { label: 'Hommes', value: firstOuts.gender.H, color: GENDER_COLORS.H }
    ];
    if (firstOuts.gender.unknown) {
        genderEntries.push({ label: 'Non renseigné', value: firstOuts.gender.unknown, color: '#999999' });
    }
    const genderChart = document.createElement('div');
    genderChart.className = 'first-out-gender-chart';
    charts.appendChild(genderChart);
    renderPie(genderChart, 'Répartition par genre des premiers éliminés', genderEntries);
    for (const [gender, label] of [['F', 'femmes'], ['H', 'hommes']]) {
        const section = document.createElement('section');
        section.className = 'pie-comparison-section';
        const heading = document.createElement('h3');
        heading.textContent = `Répartition des âges : ${label}`;
        const pair = document.createElement('div');
        pair.className = 'pie-comparison';
        section.append(heading, pair);
        charts.appendChild(section);
        renderPie(pair, gender === 'F' ? 'Premières éliminées' : 'Premiers éliminés', groupAges(firstOuts.ages[gender].counts), 'pie-comparison-chart');
        renderPie(pair, 'Toutes les participations', groupAges(candidateStats.ages.all[gender].counts), 'pie-comparison-chart');
    }
}

function groupAges(counts) {
    const groups = [
        { label: '18 à 25 ans', value: 0, color: '#0072B2' },
        { label: '26 à 35 ans', value: 0, color: '#E69F00' },
        { label: '36 à 45 ans', value: 0, color: '#009E73' },
        { label: '46 ans et plus', value: 0, color: '#CC79A7' }
    ];
    let under18 = 0;
    for (const [ageString, count] of Object.entries(counts)) {
        const age = Number(ageString);
        if (age < 18) under18 += count;
        else if (age <= 25) groups[0].value += count;
        else if (age <= 35) groups[1].value += count;
        else if (age <= 45) groups[2].value += count;
        else groups[3].value += count;
    }
    if (under18) groups.unshift({ label: 'Moins de 18 ans', value: under18, color: '#999999' });
    return groups;
}

function chartCard(container, title, className = 'gender-chart') {
    const card = document.createElement('div');
    card.className = className;
    const heading = document.createElement(className === 'pie-comparison-chart' ? 'h4' : 'h3');
    heading.textContent = title;
    card.appendChild(heading);
    container.appendChild(card);
    return card;
}

function renderAgeChart(container, title, stats, candidates) {
    const card = chartCard(container, title);
    const allAges = Object.keys(stats.all.counts).map(Number);
    if (!allAges.length) {
        card.append('Aucun âge disponible.');
        return;
    }
    const width = 660, height = 300, margin = { top: 20, right: 20, bottom: 45, left: 45 };
    const ages = d3.range(d3.min(allAges), d3.max(allAges) + 1);
    const x = d3.scaleBand().domain(ages).range([margin.left, width - margin.right]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(Object.values(stats.all.counts))]).nice()
        .range([height - margin.bottom, margin.top]);
    const layout = document.createElement('div');
    layout.className = 'age-chart-layout';
    const graph = document.createElement('div');
    graph.className = 'age-chart-graph';
    const details = document.createElement('div');
    details.className = 'age-details';
    details.setAttribute('aria-live', 'polite');
    details.textContent = 'Survolez ou sélectionnez un âge pour afficher les candidats.';
    layout.append(graph, details);
    card.appendChild(layout);
    const svg = d3.select(graph).append('svg').attr('viewBox', `0 0 ${width} ${height}`)
        .attr('class', 'stats-svg').attr('role', 'group').attr('aria-label', title);
    const ticks = ages.filter(age => age % 5 === 0);
    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickValues(ticks.length ? ticks : ages).tickFormat(d3.format('d')));
    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')));
    svg.append('text').attr('x', width / 2).attr('y', height - 5).attr('text-anchor', 'middle').text('Âge');
    svg.append('text').attr('x', margin.left).attr('y', 12).text('Candidats');
    const data = ages.map(age => {
        const female = stats.F.counts[age] || 0;
        const male = stats.H.counts[age] || 0;
        return { age, F: female, H: male, unknown: (stats.all.counts[age] || 0) - female - male };
    });
    const colors = { ...GENDER_COLORS, unknown: '#999999' };
    const keys = ['F', 'H'];
    if (data.some(row => row.unknown > 0)) keys.push('unknown');
    const stack = d3.stack().keys(keys)(data);
    for (const series of stack) {
        svg.append('g').attr('fill', colors[series.key]).selectAll('rect')
            .data(series).join('rect')
            .attr('x', segment => x(segment.data.age))
            .attr('y', segment => y(segment[1]))
            .attr('height', segment => y(segment[0]) - y(segment[1]))
            .attr('width', x.bandwidth())
            .append('title')
            .text(segment => `${segment.data.age} ans : ${segment.data[series.key]} ${series.key === 'F' ? 'femmes' : series.key === 'H' ? 'hommes' : 'genre non renseigné'}`);
    }
    let lockedAge = null;
    function showAge(age) {
        const matches = candidates.filter(candidate => Number(candidate.age) === age);
        details.replaceChildren();
        const heading = document.createElement('strong');
        heading.textContent = `${age} ans — ${matches.length} candidat${matches.length > 1 ? 's' : ''}`;
        details.appendChild(heading);
        const list = document.createElement('ul');
        for (const candidate of matches) {
            const item = document.createElement('li');
            const placement = candidate.place == null ? 'classement inconnu' : `${candidate.place}e`;
            item.textContent = `${candidate.nom} — ${candidate.saison} — ${placement}`;
            list.appendChild(item);
        }
        details.appendChild(list);
    }
    function selectAge(age) {
        lockedAge = lockedAge === age ? null : age;
        hitAreas.attr('aria-pressed', row => row.age === lockedAge ? 'true' : 'false')
            .classed('selected', row => row.age === lockedAge);
        showAge(age);
    }
    const hitAreas = svg.append('g').selectAll('rect').data(data.filter(row => row.F + row.H + row.unknown > 0))
        .join('rect')
        .attr('x', row => x(row.age)).attr('y', margin.top)
        .attr('width', x.bandwidth()).attr('height', height - margin.bottom - margin.top)
        .attr('fill', 'transparent').attr('class', 'age-hit-area')
        .attr('tabindex', 0).attr('role', 'button').attr('aria-pressed', 'false')
        .attr('aria-label', row => `${row.age} ans : afficher les candidats`)
        .on('pointerenter focus', (event, row) => { if (lockedAge === null) showAge(row.age); })
        .on('click', (event, row) => selectAge(row.age))
        .on('keydown', function(event, row) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectAge(row.age);
            }
        });
    const legend = document.createElement('div');
    legend.className = 'stats-legend';
    for (const [key, label, color] of [['all', 'Ensemble', '#333333'], ['F', 'Femmes', GENDER_COLORS.F], ['H', 'Hommes', GENDER_COLORS.H]]) {
        const average = stats[key].average === null ? 'non disponible' : `${stats[key].average.toFixed(1).replace('.', ',')} ans`;
        const item = document.createElement('span');
        item.innerHTML = `<i style="background:${color}"></i>${label} : ${average} (n = ${stats[key].total})`;
        legend.appendChild(item);
    }
    if (keys.includes('unknown')) {
        const item = document.createElement('span');
        item.innerHTML = '<i style="background:#999999"></i>Genre non renseigné';
        legend.appendChild(item);
    }
    card.appendChild(legend);
}

function renderPie(container, title, entries, className = 'gender-chart') {
    const card = chartCard(container, title, className);
    const total = d3.sum(entries, entry => entry.value);
    if (!total) {
        card.append('Aucune donnée disponible.');
        return;
    }
    const svg = d3.select(card).append('svg').attr('viewBox', '-120 -120 240 240')
        .attr('class', 'pie-svg').attr('role', 'group').attr('aria-label', title);
    const arc = d3.arc().innerRadius(0).outerRadius(105);
    const hoverInfo = document.createElement('p');
    hoverInfo.className = 'pie-hover-info';
    hoverInfo.setAttribute('aria-live', 'polite');
    hoverInfo.textContent = 'Survolez ou sélectionnez un secteur.';
    const showSlice = slice => {
        hoverInfo.textContent = `${slice.data.label} : ${slice.data.value} (${(slice.data.value / total * 100).toFixed(1).replace('.', ',')} %)`;
    };
    svg.selectAll('path').data(d3.pie().sort(null).value(entry => entry.value)(entries))
        .join('path').attr('d', arc).attr('fill', slice => slice.data.color)
        .attr('stroke', '#fff').attr('class', 'pie-slice')
        .attr('tabindex', slice => slice.data.value ? 0 : null)
        .attr('aria-label', slice => `${slice.data.label} : ${slice.data.value} (${(slice.data.value / total * 100).toFixed(1).replace('.', ',')} %)`)
        .on('pointerenter focus click', (event, slice) => showSlice(slice))
        .append('title')
        .text(slice => `${slice.data.label} : ${slice.data.value} (${(slice.data.value / total * 100).toFixed(1)} %)`);
    card.appendChild(hoverInfo);
    const legend = document.createElement('div');
    legend.className = 'stats-legend';
    entries.forEach(entry => {
        const item = document.createElement('span');
        const percent = (entry.value / total * 100).toFixed(1).replace('.', ',');
        item.innerHTML = `<i style="background:${entry.color}"></i>${entry.label} : ${entry.value} (${percent} %)`;
        legend.appendChild(item);
    });
    card.appendChild(legend);
}

window.addEventListener('load', init);
