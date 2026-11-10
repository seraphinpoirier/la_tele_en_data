// Data storage
let departmentsData = {};
let regionsData = {};
let genderStats = {};
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
    await createMaps();
    renderGenderCharts();
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
    } catch (error) {
        console.error('Error loading data:', error);
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
    Bleu: '#1f77b4',
    Orange: '#ff7f0e',
    Vert: '#2ca02c',
    Violet: '#9467bd'
};

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

window.addEventListener('load', init);
