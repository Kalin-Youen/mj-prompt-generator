/**
 * Prompt Generator for Midjourney/Niji
 * 提示词生成器核心逻辑
 * 手动上传模式 - 使用 ImgBB 图床
 */

// ===== State Management =====
const state = {
    imageUrl: '',
    promptText: '',
    styles: [],
    params: {
        ar: '16:9',
        stylize: 400,
        chaos: 5,
        iw: 1.0,
        version: { type: 'niji', value: '7' },
        quality: 1,
        seed: null,
        tile: false,
        no: '',
        cref: '',
        cw: 100,
        sref: '',
        sw: 100
    }
};

// ===== DOM Elements =====
const elements = {
    // Upload
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    previewImage: document.getElementById('previewImage'),
    imageUrl: document.getElementById('imageUrl'),
    imageUrlDisplay: document.getElementById('imageUrlDisplay'),
    clearImage: document.getElementById('clearImage'),

    // Prompt
    promptText: document.getElementById('promptText'),
    tags: document.querySelectorAll('.tag'),

    // Config
    toggleConfig: document.getElementById('toggleConfig'),
    configPanel: document.getElementById('configPanel'),

    // Parameters
    aspectRatioBtns: document.querySelectorAll('#aspectRatio .ratio-btn'),
    stylizeSlider: document.getElementById('stylize'),
    stylizeValue: document.getElementById('stylizeValue'),
    chaosSlider: document.getElementById('chaos'),
    chaosValue: document.getElementById('chaosValue'),
    iwSlider: document.getElementById('iw'),
    iwValue: document.getElementById('iwValue'),
    nijiVersionBtns: document.querySelectorAll('#nijiVersion .version-btn'),
    mjVersionBtns: document.querySelectorAll('#mjVersion .version-btn'),
    versionValue: document.getElementById('versionValue'),
    qualityBtns: document.querySelectorAll('#quality .quality-btn'),
    qualityValue: document.getElementById('qualityValue'),
    seedInput: document.getElementById('seed'),
    seedValue: document.getElementById('seedValue'),
    randomSeed: document.getElementById('randomSeed'),
    tileToggle: document.getElementById('tile'),
    tileValue: document.getElementById('tileValue'),
    noPrompt: document.getElementById('noPrompt'),
    crefUrl: document.getElementById('crefUrl'),
    cwSlider: document.getElementById('cw'),
    cwValue: document.getElementById('cwValue'),
    srefUrl: document.getElementById('srefUrl'),
    swSlider: document.getElementById('sw'),
    swValue: document.getElementById('swValue'),

    // Output
    outputPrompt: document.getElementById('outputPrompt'),
    copyBtn: document.getElementById('copyBtn'),
    copyToast: document.getElementById('copyToast')
};

// ===== Image Upload Handling (Manual Mode) =====
function initImageUpload() {
    // Click to open ImgBB upload page
    elements.dropZone.addEventListener('click', () => {
        // Open ImgBB in new window
        window.open('https://zh-cn.imgbb.com/upload', '_blank', 'width=800,height=600');

        // Show instruction
        showInstruction();
    });

    // URL input - support both direct URLs and ImgBB share URLs
    elements.imageUrl.addEventListener('input', (e) => {
        const inputUrl = e.target.value.trim();
        state.imageUrl = convertToDirectUrl(inputUrl);

        // If valid URL, show preview
        if (state.imageUrl) {
            elements.previewImage.src = state.imageUrl;
            elements.previewImage.classList.remove('hidden');
            elements.dropZone.querySelector('.drop-zone-content').style.opacity = '0';
            elements.clearImage.classList.remove('hidden');
        }

        updateOutput();
    });

    // Paste event - handle pasted URLs
    elements.imageUrl.addEventListener('paste', (e) => {
        setTimeout(() => {
            const inputUrl = elements.imageUrl.value.trim();
            const directUrl = convertToDirectUrl(inputUrl);

            if (directUrl !== inputUrl) {
                elements.imageUrl.value = directUrl;
                state.imageUrl = directUrl;

                // Show preview
                elements.previewImage.src = directUrl;
                elements.previewImage.classList.remove('hidden');
                elements.dropZone.querySelector('.drop-zone-content').style.opacity = '0';
                elements.clearImage.classList.remove('hidden');

                showToast('已自动转换为直链!');
                updateOutput();
            }
        }, 100);
    });

    // Clear image
    elements.clearImage.addEventListener('click', () => {
        clearImage();
    });

    // Show URL input by default
    elements.imageUrlDisplay.classList.remove('hidden');
}

// Convert ImgBB share URL or HTML embed code to direct image URL
function convertToDirectUrl(input) {
    if (!input) return '';

    const text = input.trim();

    // Case 1: Already a direct image URL with extension
    if (text.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
        return text;
    }

    // Case 2: Already an i.ibb.co direct URL
    if (text.match(/^https?:\/\/i\.ibb\.co\//)) {
        return text;
    }

    // Case 3: HTML embed code - extract src from <img> tag
    // Format: <a href="..."><img src="https://i.ibb.co/xxx/image.jpg" ...></a>
    const imgSrcMatch = text.match(/src=["'](https?:\/\/i\.ibb\.co\/[^"']+)["']/i);
    if (imgSrcMatch) {
        return imgSrcMatch[1];
    }

    // Case 4: BBCode format - [img]URL[/img]
    const bbcodeMatch = text.match(/\[img\](https?:\/\/[^\[]+)\[\/img\]/i);
    if (bbcodeMatch) {
        return bbcodeMatch[1];
    }

    // Case 5: Markdown format - ![alt](URL)
    const markdownMatch = text.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
    if (markdownMatch) {
        return markdownMatch[1];
    }

    // Case 6: Any URL containing i.ibb.co anywhere in the text
    const anyIbbMatch = text.match(/(https?:\/\/i\.ibb\.co\/[a-zA-Z0-9]+\/[^\s"'<>]+)/);
    if (anyIbbMatch) {
        return anyIbbMatch[1];
    }

    // Case 7: Other image hosting direct links
    const otherImageMatch = text.match(/(https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|webp)(\?[^\s"'<>]*)?)/i);
    if (otherImageMatch) {
        return otherImageMatch[1];
    }

    // Return as-is if no pattern matches
    return text;
}

function showInstruction() {
    // Create instruction overlay
    let overlay = document.getElementById('instructionOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'instructionOverlay';
        overlay.className = 'instruction-overlay';
        overlay.innerHTML = `
            <div class="instruction-content">
                <h3>📸 如何获取图片链接</h3>
                <ol>
                    <li>在打开的 ImgBB 页面中上传图片</li>
                    <li>上传完成后，点击 <strong>"获取分享链接"</strong></li>
                    <li>选择 <strong>"直接链接"</strong>（以 i.ibb.co 开头）</li>
                    <li>复制链接并粘贴到下方输入框</li>
                </ol>
                <div class="instruction-example">
                    <span class="example-label">示例链接:</span>
                    <code>https://i.ibb.co/xxxxx/image.jpg</code>
                </div>
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.classList.add('hidden')">
                    我知道了
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.classList.remove('hidden');
    }

    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.add('hidden');
        }
    });
}

function clearImage() {
    state.imageUrl = '';
    elements.previewImage.src = '';
    elements.previewImage.classList.add('hidden');
    elements.dropZone.querySelector('.drop-zone-content').style.opacity = '1';
    elements.imageUrl.value = '';
    elements.clearImage.classList.add('hidden');
    updateOutput();
}

// ===== Prompt Text Handling =====
function initPromptText() {
    elements.promptText.addEventListener('input', (e) => {
        state.promptText = e.target.value;
        updateOutput();
    });
}

// ===== Style Tags Handling =====
function initStyleTags() {
    elements.tags.forEach(tag => {
        tag.addEventListener('click', () => {
            const value = tag.dataset.value;
            tag.classList.toggle('active');

            if (tag.classList.contains('active')) {
                state.styles.push(value);
            } else {
                state.styles = state.styles.filter(s => s !== value);
            }

            updateOutput();
        });
    });
}

// ===== Config Panel Toggle =====
function initConfigPanel() {
    elements.toggleConfig.addEventListener('click', () => {
        elements.configPanel.classList.toggle('open');
        const isOpen = elements.configPanel.classList.contains('open');
        elements.toggleConfig.querySelector('span:last-child').textContent =
            isOpen ? '收起参数' : '配置参数';
    });

    // Open by default
    elements.configPanel.classList.add('open');
}

// ===== Parameter Controls =====
function initParameters() {
    // Aspect Ratio
    elements.aspectRatioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.aspectRatioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.params.ar = btn.dataset.value;
            document.getElementById('arValue').textContent = btn.dataset.value;
            updateOutput();
        });
    });

    // Stylize slider
    elements.stylizeSlider.addEventListener('input', (e) => {
        state.params.stylize = parseInt(e.target.value);
        elements.stylizeValue.textContent = e.target.value;
        updateOutput();
    });

    // Chaos slider
    elements.chaosSlider.addEventListener('input', (e) => {
        state.params.chaos = parseInt(e.target.value);
        elements.chaosValue.textContent = e.target.value;
        updateOutput();
    });

    // Image Weight slider
    elements.iwSlider.addEventListener('input', (e) => {
        state.params.iw = parseFloat(e.target.value);
        elements.iwValue.textContent = parseFloat(e.target.value).toFixed(1);
        updateOutput();
    });

    // Niji Version
    elements.nijiVersionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Clear MJ selection
            elements.mjVersionBtns.forEach(b => b.classList.remove('active'));
            // Set Niji selection
            elements.nijiVersionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            state.params.version = { type: 'niji', value: btn.dataset.value };
            elements.versionValue.textContent = `Niji ${btn.dataset.value}`;
            updateOutput();
        });
    });

    // Midjourney Version
    elements.mjVersionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Clear Niji selection
            elements.nijiVersionBtns.forEach(b => b.classList.remove('active'));
            // Set MJ selection
            elements.mjVersionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            state.params.version = { type: 'mj', value: btn.dataset.value };
            elements.versionValue.textContent = `MJ ${btn.dataset.value}`;
            updateOutput();
        });
    });

    // Quality
    elements.qualityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.qualityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.params.quality = parseFloat(btn.dataset.value);
            elements.qualityValue.textContent = btn.dataset.value;
            updateOutput();
        });
    });

    // Seed
    elements.seedInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        state.params.seed = value ? parseInt(value) : null;
        elements.seedValue.textContent = value || '随机';
        updateOutput();
    });

    // Random seed button
    elements.randomSeed.addEventListener('click', () => {
        const randomSeed = Math.floor(Math.random() * 4294967295);
        elements.seedInput.value = randomSeed;
        state.params.seed = randomSeed;
        elements.seedValue.textContent = randomSeed;
        updateOutput();
    });

    // Tile toggle
    elements.tileToggle.addEventListener('change', (e) => {
        state.params.tile = e.target.checked;
        elements.tileValue.textContent = e.target.checked ? '开启' : '关闭';
        updateOutput();
    });

    // Negative prompt
    elements.noPrompt.addEventListener('input', (e) => {
        state.params.no = e.target.value.trim();
        updateOutput();
    });

    // Character Reference
    elements.crefUrl.addEventListener('input', (e) => {
        state.params.cref = e.target.value.trim();
        updateOutput();
    });

    elements.cwSlider.addEventListener('input', (e) => {
        state.params.cw = parseInt(e.target.value);
        elements.cwValue.textContent = e.target.value;
        updateOutput();
    });

    // Style Reference
    elements.srefUrl.addEventListener('input', (e) => {
        state.params.sref = e.target.value.trim();
        updateOutput();
    });

    elements.swSlider.addEventListener('input', (e) => {
        state.params.sw = parseInt(e.target.value);
        elements.swValue.textContent = e.target.value;
        updateOutput();
    });
}

// ===== Generate Output =====
function generatePrompt() {
    const parts = [];

    // Add image URL if exists
    if (state.imageUrl) {
        parts.push(state.imageUrl);
    }

    // Add main prompt text
    if (state.promptText) {
        parts.push(state.promptText.trim());
    }

    // Add style keywords
    if (state.styles.length > 0) {
        parts.push(state.styles.join(', '));
    }

    // Build the main prompt text
    let prompt = parts.join(' ');

    // Add parameters
    const params = [];

    // Chaos (only if > 0)
    if (state.params.chaos > 0) {
        params.push(`--chaos ${state.params.chaos}`);
    }

    // Aspect ratio
    params.push(`--ar ${state.params.ar}`);

    // Stylize (only if not default 100)
    if (state.params.stylize !== 100) {
        params.push(`--stylize ${state.params.stylize}`);
    }

    // Version
    if (state.params.version.type === 'niji') {
        params.push(`--niji ${state.params.version.value}`);
    } else {
        params.push(`--v ${state.params.version.value}`);
    }

    // Image weight (only if image URL exists)
    if (state.imageUrl) {
        params.push(`--iw ${state.params.iw.toFixed(1)}`);
    }

    // Quality (only if not default 1)
    if (state.params.quality !== 1) {
        params.push(`--q ${state.params.quality}`);
    }

    // Seed (only if specified)
    if (state.params.seed !== null) {
        params.push(`--seed ${state.params.seed}`);
    }

    // Tile
    if (state.params.tile) {
        params.push('--tile');
    }

    // Negative prompt
    if (state.params.no) {
        params.push(`--no ${state.params.no}`);
    }

    // Character Reference
    if (state.params.cref) {
        params.push(`--cref ${state.params.cref}`);
        if (state.params.cw !== 100) {
            params.push(`--cw ${state.params.cw}`);
        }
    }

    // Style Reference
    if (state.params.sref) {
        params.push(`--sref ${state.params.sref}`);
        if (state.params.sw !== 100) {
            params.push(`--sw ${state.params.sw}`);
        }
    }

    // Combine prompt and parameters
    if (prompt && params.length > 0) {
        return `${prompt} ${params.join(' ')}`;
    } else if (params.length > 0) {
        return params.join(' ');
    }

    return prompt || '在上方输入描述和配置参数，提示词将在此实时生成...';
}

function updateOutput() {
    const prompt = generatePrompt();
    elements.outputPrompt.textContent = prompt;
}

// ===== Copy to Clipboard =====
function initCopy() {
    elements.copyBtn.addEventListener('click', async () => {
        const prompt = generatePrompt();

        try {
            await navigator.clipboard.writeText(prompt);
            showToast('已复制到剪贴板!');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = prompt;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('已复制到剪贴板!');
        }
    });
}

function showToast(message = '✅ 已复制到剪贴板!') {
    elements.copyToast.textContent = `✅ ${message}`;
    elements.copyToast.classList.remove('hidden');
    elements.copyToast.classList.add('show');

    setTimeout(() => {
        elements.copyToast.classList.remove('show');
        setTimeout(() => {
            elements.copyToast.classList.add('hidden');
        }, 300);
    }, 2000);
}

// ===== Tag Explorer =====
const tagExplorerState = {
    currentCategory: 'all',
    searchQuery: '',
    displayedTags: [],
    loadedCount: 0,
    batchSize: 50,
    allTags: []
};

function initTagExplorer() {
    const openBtn = document.getElementById('openTagExplorer');
    const closeBtn = document.getElementById('closeTagExplorer');
    const explorer = document.getElementById('tagExplorer');
    const searchInput = document.getElementById('tagSearch');
    const refreshBtn = document.getElementById('refreshTags');
    const loadMoreBtn = document.getElementById('loadMoreTags');
    const categoriesContainer = document.getElementById('tagCategories');
    const contentContainer = document.getElementById('tagExplorerContent');

    if (!openBtn || !explorer) return;

    // Flatten all tags into a single array
    flattenAllTags();

    // Open explorer
    openBtn.addEventListener('click', () => {
        explorer.classList.remove('hidden');
        renderCategories();
        renderTags();
    });

    // Close explorer
    closeBtn.addEventListener('click', () => {
        explorer.classList.add('hidden');
    });

    // Click outside to close
    explorer.addEventListener('click', (e) => {
        if (e.target === explorer) {
            explorer.classList.add('hidden');
        }
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        tagExplorerState.searchQuery = e.target.value.trim().toLowerCase();
        tagExplorerState.loadedCount = 0;
        renderTags();
    });

    // Refresh (shuffle)
    refreshBtn.addEventListener('click', () => {
        shuffleArray(tagExplorerState.allTags);
        tagExplorerState.loadedCount = 0;
        renderTags();
        showToast('已刷新标签顺序!');
    });

    // Load more
    loadMoreBtn.addEventListener('click', () => {
        loadMoreTags();
    });

    // Infinite scroll
    contentContainer.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = contentContainer;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadMoreTags();
        }
    });

    // Online search dropdown
    const searchOnlineBtn = document.getElementById('searchOnline');
    const searchDropdown = document.querySelector('.search-dropdown');
    const searchDropdownMenu = document.getElementById('searchDropdownMenu');

    // Search sites configuration
    const searchSites = {
        lexica: {
            name: 'Lexica.art',
            url: (q) => `https://lexica.art/?q=${encodeURIComponent(q)}`,
            noQueryUrl: 'https://lexica.art'
        },
        prompthero: {
            name: 'PromptHero',
            url: (q) => `https://prompthero.com/search?q=${encodeURIComponent(q)}`,
            noQueryUrl: 'https://prompthero.com'
        },
        openart: {
            name: 'OpenArt',
            url: (q) => `https://openart.ai/discovery?q=${encodeURIComponent(q)}`,
            noQueryUrl: 'https://openart.ai/discovery'
        },
        civitai: {
            name: 'Civitai',
            url: (q) => `https://civitai.com/images?query=${encodeURIComponent(q)}`,
            noQueryUrl: 'https://civitai.com/images'
        },
        arthub: {
            name: 'Arthub.ai',
            url: (q) => `https://arthub.ai/search?q=${encodeURIComponent(q)}`,
            noQueryUrl: 'https://arthub.ai'
        },
        midlibrary: {
            name: 'MidLibrary',
            url: (q) => `https://midlibrary.io/?search=${encodeURIComponent(q)}`,
            noQueryUrl: 'https://midlibrary.io'
        },
        krea: {
            name: 'Krea.ai',
            url: (q) => `https://search.krea.ai/?q=${encodeURIComponent(q)}`,
            noQueryUrl: 'https://search.krea.ai'
        },
        promptbase: {
            name: 'PromptBase',
            url: (q) => `https://promptbase.com/search?q=${encodeURIComponent(q)}`,
            noQueryUrl: 'https://promptbase.com'
        }
    };

    if (searchOnlineBtn && searchDropdownMenu) {
        // Toggle dropdown on button click
        searchOnlineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchDropdown.classList.toggle('open');
        });

        // Handle search option clicks
        searchDropdownMenu.querySelectorAll('.search-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const site = option.dataset.site;
                const query = searchInput.value.trim();
                const siteConfig = searchSites[site];

                if (siteConfig) {
                    const url = query ? siteConfig.url(query) : siteConfig.noQueryUrl;
                    window.open(url, '_blank');
                    showToast(`已打开 ${siteConfig.name}`);
                }

                searchDropdown.classList.remove('open');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchDropdown.contains(e.target)) {
                searchDropdown.classList.remove('open');
            }
        });
    }

    // Tab switching (local vs online)
    const tabBtns = explorer.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (mode === 'online') {
                // Switch to online mode - show all search sites
                contentContainer.innerHTML = `
                    <div class="online-mode-info">
                        <div class="online-icon">🌐</div>
                        <h3>在线提示词资源</h3>
                        <p>点击上方 <strong>🌐 在线搜索</strong> 按钮，选择网站后跳转搜索</p>
                        <div class="online-sites-grid">
                            <a href="https://lexica.art" target="_blank" class="online-site-card">
                                <span class="site-emoji">🎨</span>
                                <span class="site-title">Lexica.art</span>
                                <span class="site-subtitle">SD提示词搜索引擎</span>
                            </a>
                            <a href="https://prompthero.com" target="_blank" class="online-site-card">
                                <span class="site-emoji">🦸</span>
                                <span class="site-title">PromptHero</span>
                                <span class="site-subtitle">最大提示词社区</span>
                            </a>
                            <a href="https://openart.ai/discovery" target="_blank" class="online-site-card">
                                <span class="site-emoji">🖼️</span>
                                <span class="site-title">OpenArt</span>
                                <span class="site-subtitle">AI艺术与提示词</span>
                            </a>
                            <a href="https://civitai.com/images" target="_blank" class="online-site-card">
                                <span class="site-emoji">🔥</span>
                                <span class="site-title">Civitai</span>
                                <span class="site-subtitle">模型与提示词分享</span>
                            </a>
                            <a href="https://arthub.ai" target="_blank" class="online-site-card">
                                <span class="site-emoji">🌟</span>
                                <span class="site-title">Arthub.ai</span>
                                <span class="site-subtitle">AI作品灵感库</span>
                            </a>
                            <a href="https://midlibrary.io" target="_blank" class="online-site-card">
                                <span class="site-emoji">📚</span>
                                <span class="site-title">MidLibrary</span>
                                <span class="site-subtitle">Midjourney风格库</span>
                            </a>
                            <a href="https://search.krea.ai" target="_blank" class="online-site-card">
                                <span class="site-emoji">✨</span>
                                <span class="site-title">Krea.ai</span>
                                <span class="site-subtitle">AI图像探索</span>
                            </a>
                            <a href="https://promptbase.com" target="_blank" class="online-site-card">
                                <span class="site-emoji">💎</span>
                                <span class="site-title">PromptBase</span>
                                <span class="site-subtitle">提示词市场</span>
                            </a>
                        </div>
                        <p class="online-tip">💡 在这些网站找到喜欢的提示词后，复制粘贴到主编辑区即可使用</p>
                    </div>
                `;
            } else {
                // Switch back to local mode
                renderCategories();
                renderTags();
            }
        });
    });
}

function flattenAllTags() {
    tagExplorerState.allTags = [];

    if (typeof TAG_DATABASE === 'undefined') {
        console.warn('TAG_DATABASE not loaded');
        return;
    }

    for (const [categoryKey, category] of Object.entries(TAG_DATABASE)) {
        for (const tag of category.tags) {
            tagExplorerState.allTags.push({
                ...tag,
                category: categoryKey,
                categoryName: category.name
            });
        }
    }

    // Shuffle initially
    shuffleArray(tagExplorerState.allTags);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderCategories() {
    const container = document.getElementById('tagCategories');
    if (!container || typeof TAG_DATABASE === 'undefined') return;

    let html = `<button class="category-btn ${tagExplorerState.currentCategory === 'all' ? 'active' : ''}" data-category="all">🌟 全部</button>`;

    for (const [key, category] of Object.entries(TAG_DATABASE)) {
        const isActive = tagExplorerState.currentCategory === key;
        html += `<button class="category-btn ${isActive ? 'active' : ''}" data-category="${key}">${category.name}</button>`;
    }

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tagExplorerState.currentCategory = btn.dataset.category;
            tagExplorerState.loadedCount = 0;
            renderCategories();
            renderTags();
        });
    });
}

function getFilteredTags() {
    let tags = [...tagExplorerState.allTags];

    // Filter by category
    if (tagExplorerState.currentCategory !== 'all') {
        tags = tags.filter(t => t.category === tagExplorerState.currentCategory);
    }

    // Filter by search
    if (tagExplorerState.searchQuery) {
        const query = tagExplorerState.searchQuery;
        tags = tags.filter(t =>
            t.en.toLowerCase().includes(query) ||
            t.zh.includes(query)
        );
    }

    return tags;
}

function renderTags() {
    const container = document.getElementById('tagExplorerContent');
    if (!container) return;

    const filteredTags = getFilteredTags();
    const tagsToShow = filteredTags.slice(0, tagExplorerState.batchSize);
    tagExplorerState.loadedCount = tagsToShow.length;

    if (tagsToShow.length === 0) {
        container.innerHTML = '<div class="tag-loading">没有找到匹配的标签</div>';
        return;
    }

    // Group by category if showing all
    if (tagExplorerState.currentCategory === 'all' && !tagExplorerState.searchQuery) {
        renderTagsByCategory(container, tagsToShow);
    } else {
        renderTagsFlat(container, tagsToShow);
    }

    updateSelectedCount();
}

function renderTagsByCategory(container, tags) {
    // Group tags by category
    const grouped = {};
    for (const tag of tags) {
        if (!grouped[tag.category]) {
            grouped[tag.category] = {
                name: tag.categoryName,
                tags: []
            };
        }
        grouped[tag.category].tags.push(tag);
    }

    let html = '';
    for (const [key, group] of Object.entries(grouped)) {
        html += `
            <div class="tag-category-section">
                <h3 class="tag-category-title">${group.name}</h3>
                <div class="tag-grid">
                    ${group.tags.map(tag => createTagHTML(tag)).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
    attachTagClickHandlers(container);
}

function renderTagsFlat(container, tags) {
    const html = `
        <div class="tag-grid">
            ${tags.map(tag => createTagHTML(tag)).join('')}
        </div>
    `;

    container.innerHTML = html;
    attachTagClickHandlers(container);
}

function createTagHTML(tag) {
    const isSelected = state.styles.includes(tag.en);
    return `
        <button class="explorer-tag ${isSelected ? 'selected' : ''}" data-value="${tag.en}">
            <span class="tag-en">${tag.en}</span>
            <span class="tag-zh">${tag.zh}</span>
        </button>
    `;
}

function attachTagClickHandlers(container) {
    container.querySelectorAll('.explorer-tag').forEach(tagEl => {
        tagEl.addEventListener('click', () => {
            const value = tagEl.dataset.value;

            if (tagEl.classList.contains('selected')) {
                // Remove from styles
                state.styles = state.styles.filter(s => s !== value);
                tagEl.classList.remove('selected');

                // Also update main tags if exists
                const mainTag = document.querySelector(`.tags-container .tag[data-value="${value}"]`);
                if (mainTag) mainTag.classList.remove('active');
            } else {
                // Add to styles
                state.styles.push(value);
                tagEl.classList.add('selected');

                // Also update main tags if exists
                const mainTag = document.querySelector(`.tags-container .tag[data-value="${value}"]`);
                if (mainTag) mainTag.classList.add('active');
            }

            updateOutput();
            updateSelectedCount();
        });
    });
}

function loadMoreTags() {
    const container = document.getElementById('tagExplorerContent');
    const tagGrid = container.querySelector('.tag-grid:last-child');
    if (!tagGrid) return;

    const filteredTags = getFilteredTags();
    const nextBatch = filteredTags.slice(
        tagExplorerState.loadedCount,
        tagExplorerState.loadedCount + tagExplorerState.batchSize
    );

    if (nextBatch.length === 0) return;

    nextBatch.forEach(tag => {
        const tagEl = document.createElement('button');
        tagEl.className = `explorer-tag ${state.styles.includes(tag.en) ? 'selected' : ''}`;
        tagEl.dataset.value = tag.en;
        tagEl.innerHTML = `
            <span class="tag-en">${tag.en}</span>
            <span class="tag-zh">${tag.zh}</span>
        `;

        tagEl.addEventListener('click', () => {
            const value = tagEl.dataset.value;
            if (tagEl.classList.contains('selected')) {
                state.styles = state.styles.filter(s => s !== value);
                tagEl.classList.remove('selected');
            } else {
                state.styles.push(value);
                tagEl.classList.add('selected');
            }
            updateOutput();
            updateSelectedCount();
        });

        tagGrid.appendChild(tagEl);
    });

    tagExplorerState.loadedCount += nextBatch.length;
}

function updateSelectedCount() {
    const countEl = document.getElementById('selectedTagCount');
    if (countEl) {
        countEl.textContent = state.styles.length;
    }
}

// ===== Initialize App =====
function init() {
    initImageUpload();
    initPromptText();
    initStyleTags();
    initConfigPanel();
    initParameters();
    initCopy();
    initTagExplorer();

    // Initial output
    updateOutput();

    console.log('🎨 Prompt Generator initialized with Tag Explorer!');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

