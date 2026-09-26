/**
 * BasicConfigPage 集成 — 基础模式的一页式配置入口
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'acu_v2_ui_state';
let lastMountedApp: { __resetAcuV2MountForTests: () => void } | null = null;

function createSettings() {
  return {
    apiMode: 'custom',
    apiConfig: { url: '', apiKey: '', model: '', useMainApi: true, max_tokens: 60000, temperature: 1 },
    tavernProfile: '',
    streamingEnabled: false,
    apiPresets: [
      { name: 'main-api', apiMode: 'custom', apiConfig: { url: '', apiKey: '', model: '', useMainApi: true, max_tokens: 60000, temperature: 1 }, tavernProfile: '' },
    ],
    defaultApiPresetName: 'main-api',
    apiPresetBindingsByChat: {},
    tableApiPresetOverridesByName: {},
    autoUpdateEnabled: true,
    toastMuteEnabled: false,
    promptTemplateSettings: { enabled: true },
    zeroTkOccupyModeDefault: false,
    summaryVectorIndexModeDefault: false,
    autoUpdateFrequency: 2,
    skipUpdateFloors: 0,
    updateBatchSize: 2,
    manualSelectedTables: [],
    hasManualSelection: false,
    storageMode: 'native',
    contentOptimizationSettings: { apiPreset: '' },
    plotSettings: {
      enabled: true,
      promptPresets: [],
      plotTasks: [],
      plotWorldbookConfig: { source: 'character', manualSelection: [], enabledEntries: {} },
    },
    plotApiPreset: '',
    plotTaskApiPresetOverridesById: {},
  } as any;
}

async function mountBasicConfigPage(settings = createSettings()) {
  vi.resetModules();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ uiMode: { mode: 'basic' } }));

  const { ref } = await import('vue');

  vi.doMock('../../../src/presentation-v2/composables/useChatChangedListener', () => ({
    useChatChangedListener: () => {},
    useChatChangedTick: () => ref(0),
  }));
  vi.doMock('../../../src/service/runtime/state-manager', () => ({
    settings_ACU: settings,
    currentChatFileIdentifier_ACU: 'chat-basic-config',
    currentJsonTableData_ACU: {},
    coreApisAreReady_ACU: true,
    getCurrentIsolationKey_ACU: () => '',
  }));
  vi.doMock('../../../src/service/settings/settings-service', () => ({
    saveSettings_ACU: vi.fn(() => ({ saved: true, storageType: 'memory' })),
    setGlobalPlotEnabled_ACU: vi.fn((enabled: boolean) => { settings.plotSettings.enabled = enabled; }),
    setZeroTkOccupyMode_ACU: vi.fn((enabled: boolean) => { settings.zeroTkOccupyModeDefault = enabled; }),
    setSummaryVectorIndexMode_ACU: vi.fn((enabled: boolean) => { settings.summaryVectorIndexModeDefault = enabled; }),
  }));
  vi.doMock('../../../src/service/chat/chat-service', () => ({
    getChatArray_ACU: () => [],
  }));
  vi.doMock('../../../src/service/template/chat-scope', () => ({
    getSortedSheetKeys_ACU: () => [],
    getCurrentChatPlotScopeState_ACU: () => null,
    setCurrentChatPlotScopeState_ACU: vi.fn(),
  }));
  vi.doMock('../../../src/service/template/template-preset-service', () => ({
    getActiveTemplatePresetMeta_ACU: () => ({ displayName: '默认预设', scopeLabel: '全局' }),
  }));
  vi.doMock('../../../src/service/table/storage-mode', () => ({
    getCurrentStorageMode: () => settings.storageMode,
    isSqliteMode: () => settings.storageMode === 'sqlite',
  }));
  vi.doMock('../../../src/service/table/table-storage-strategy', () => ({
    switchStorageMode: vi.fn(async (mode: string) => { settings.storageMode = mode; }),
  }));
  vi.doMock('../../../src/service/table/table-history', () => ({
    resolveTableHistoryStateFromChat_ACU: () => ({
      latestAiMessageIndex: -1,
      latestDataMessageIndex: -1,
      lastTrackedUpdateMessageIndex: -1,
      latestDataAiFloor: 0,
      lastTrackedUpdateAiFloor: 0,
      hasAnyData: false,
      hasTrackedUpdate: false,
    }),
  }));
  vi.doMock('../../../src/service/ai/ai-service', () => ({
    getConnectionManagerProfiles_ACU: () => [],
    fetchAvailableModels_ACU: vi.fn(async () => ({ success: true, models: [] })),
  }));
  vi.doMock('../../../src/presentation-v2/composables/useTableTemplatePresets', () => ({
    useTableTemplatePresets: () => ({
      busy: ref(false),
      message: ref(null),
      selectedGlobalPreset: ref(''),
      selectedGlobalPresetValue: ref('global:'),
      selectedChatPreset: ref('global:'),
      selectedChatPresetLabel: ref('默认预设（全局）'),
      isChatOverridden: ref(false),
      chatPresetItems: ref([{ value: '', label: '默认预设', meta: '内置' }]),
      chatArchiveItems: ref([]),
      runtimeTemplateItem: ref(null),
      runtimeDiffersFromLibrary: ref(false),
      runtimeTemplateAvailable: ref(false),
      chatSnapshotDiffersFromLibrary: ref(false),
      refresh: vi.fn(),
      selectGlobalPreset: vi.fn(),
      selectChatPreset: vi.fn(),
      importPresetForCurrentChat: vi.fn(),
      restoreArchivedChatTemplate: vi.fn(),
      exportTemplate: vi.fn(),
    }),
  }));
  const openVisualizer = vi.fn();
  vi.doMock('../../../src/presentation-v2/composables/useTablePresetManagement', () => ({
    useTablePresetManagement: () => ({
      drawerView: ref('closed'),
      isDrawerOpen: ref(false),
      title: ref(''),
      busy: ref(false),
      message: ref(null),
      presetMeta: ref([]),
      defaultPresetName: ref(''),
      refresh: vi.fn(),
      openManage: vi.fn(),
      closeDrawer: vi.fn(),
      openVisualizer,
      editPreset: vi.fn(),
      setAsDefault: vi.fn(),
      deletePreset: vi.fn(),
      exportPreset: vi.fn(),
      renamePreset: vi.fn(),
      createBlankPreset: vi.fn(),
    }),
  }));

  const mount = await import('../../../src/presentation-v2/bootstrap/mount');
  lastMountedApp = mount;
  await mount.openAcuV2App();
  await new Promise(r => setTimeout(r, 0));
  return { mount, settings, openVisualizer };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterEach(() => {
  lastMountedApp?.__resetAcuV2MountForTests();
  lastMountedApp = null;
});

describe('BasicConfigPage', () => {
  it('基础模式只显示基础配置页，并集中呈现 API、更新设置、表格模板、剧情推进预设', async () => {
    const { mount } = await mountBasicConfigPage();

    const page = document.querySelector('.acu-v2-basic-config-page');
    expect(page).not.toBeNull();
    const text = page!.textContent || '';
    expect(document.querySelector('.acu-v2-app__page-title')?.textContent || '').toContain('基础配置');
    const dashboard = page!.querySelector('.acu-v2-dashboard-page') as HTMLElement;
    expect(dashboard).not.toBeNull();
    expect(dashboard.textContent).not.toContain('运行概览');
    expect(dashboard.textContent).toContain('基础功能');
    expect(dashboard.textContent).toContain('进阶功能');
    expect(dashboard.textContent).toContain('更多高级功能');
    expect(dashboard.querySelector('[data-acu-toggle-group]')?.getAttribute('data-acu-toggle-group')).toBe('basic');
    expect(dashboard.textContent).toContain('自动更新');
    expect(dashboard.textContent).toContain('剧情推进');
    expect(dashboard.textContent).toContain('静默提示框');
    expect(dashboard.textContent).toContain('飞行模式');
    expect(dashboard.textContent).toContain('保存方式');
    expect(dashboard.querySelector('.acu-dashboard-storage-mode')).not.toBeNull();
    expect(text).not.toContain('配置状态');
    expect(text).toContain('API 预设');
    expect(text).toContain('更新设置');
    expect(text).toContain('填表 API 预设');
    expect(text).not.toContain('高级数值');
    expect(text).toContain('表格模板预设');
    expect(text).toContain('打开可视化表格编辑器');
    expect(text).toContain('剧情推进预设');
    expect(text).not.toContain('通常只有 API 连接需要你确认');
    const panelTitles = Array.from(page!.querySelectorAll('.acu-v2-basic-config-page__grid > .acu-panel .acu-panel__title'))
      .map(title => (title.textContent || '').trim());
    expect(panelTitles).toEqual(['API 预设', '自动更新设置', '表格模板预设', '剧情推进预设']);
    const mobileNavItems = Array.from(page!.querySelectorAll('.acu-mobile-panel-nav__item'))
      .map(item => (item.textContent || '').trim());
    expect(mobileNavItems).toEqual(['开关', 'API 预设', '更新设置', '表格模板', '剧情推进']);
    expect(document.getElementById('basic-config-update-panel')).not.toBeNull();

    const sidebarText = document.querySelector('.acu-v2-sidebar')?.textContent || '';
    expect(sidebarText).toContain('基础模式');
    expect(sidebarText).toContain('基础配置');
    expect(sidebarText).not.toContain('仪表盘');
    expect(sidebarText).not.toContain('更新参数');

    mount.__resetAcuV2MountForTests();
  });

  it('基础页挂载三组开关不会改写原有提示词设置', async () => {
    const settings = createSettings();
    settings.promptTemplateSettings.enabled = false;
    const { mount } = await mountBasicConfigPage(settings);
    const { saveSettings_ACU } = await import('../../../src/service/settings/settings-service');

    expect(document.querySelector('.acu-v2-basic-config-page .acu-v2-dashboard-page')).not.toBeNull();
    expect(settings.promptTemplateSettings.enabled).toBe(false);
    expect(saveSettings_ACU).not.toHaveBeenCalled();

    mount.__resetAcuV2MountForTests();
  });

  it('基础模式可切换三组开关，并可从更多高级功能打开高级工具', async () => {
    const { mount } = await mountBasicConfigPage();
    const dashboard = document.querySelector('.acu-v2-basic-config-page .acu-v2-dashboard-page') as HTMLElement;
    expect(dashboard).not.toBeNull();
    const radio = (label: string) => Array.from(dashboard.querySelectorAll<HTMLButtonElement>('button[role="radio"]'))
      .find(button => button.textContent?.trim() === label);
    const keys = () => Array.from(dashboard.querySelectorAll<HTMLButtonElement>('button[data-acu-toggle-key]'))
      .map(button => button.dataset.acuToggleKey);

    radio('进阶功能')!.click();
    await Promise.resolve();
    expect(dashboard.querySelector('[data-acu-toggle-group]')?.getAttribute('data-acu-toggle-group')).toBe('advanced');
    expect(keys()).toEqual(['summaryVectorIndexModeEnabled', 'zeroTkOccupyModeDefault', 'streamingEnabled']);

    radio('更多高级功能')!.click();
    await Promise.resolve();
    expect(dashboard.querySelector('[data-acu-toggle-group]')?.getAttribute('data-acu-toggle-group')).toBe('moreAdvanced');
    expect(keys()).toEqual([
      'continuationPageEnabled', 'contentReplaceEnabled', 'externalImportPageEnabled',
      'worldSimulationPageEnabled', 'developerOptionsEnabled',
    ]);
    const toolsButton = Array.from(dashboard.querySelectorAll('button'))
      .find(button => button.textContent?.trim() === '打开高级工具');
    expect(toolsButton).toBeDefined();
    toolsButton!.click();
    await new Promise(r => setTimeout(r, 0));

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(persisted.uiMode.mode).toBe('advanced');
    expect(persisted.router.activePageId).toBe('advanced-tools');
    expect(document.querySelector('.acu-v2-advanced-tools-page')).not.toBeNull();

    mount.__resetAcuV2MountForTests();
  });

  it('基础配置页的表格模板面板提供可视化表格编辑器入口', async () => {
    const { mount, openVisualizer } = await mountBasicConfigPage();

    const tablePanel = document.getElementById('basic-config-table-panel') as HTMLElement | null;
    expect(tablePanel).not.toBeNull();
    const button = Array.from(tablePanel!.querySelectorAll<HTMLButtonElement>('button'))
      .find(item => item.textContent?.trim() === '打开可视化表格编辑器');
    expect(button).not.toBeNull();
    expect(button!.classList.contains('acu-btn--primary')).toBe(true);

    button!.click();
    await Promise.resolve();

    expect(openVisualizer).toHaveBeenCalledTimes(1);

    mount.__resetAcuV2MountForTests();
  });

  it('基础配置页每个面板都渲染常驻说明信息条', async () => {
    const { mount } = await mountBasicConfigPage();

    const panels = Array.from(document.querySelectorAll<HTMLElement>('.acu-v2-basic-config-page__grid > .acu-panel'));
    expect(panels).toHaveLength(4);
    for (const panel of panels) {
      expect(panel.querySelector('.acu-panel__description-region .acu-info-banner')).not.toBeNull();
    }

    mount.__resetAcuV2MountForTests();
  });

  it('点击侧边栏模式按钮后切换到高手模式并回到仪表盘', async () => {
    const { mount } = await mountBasicConfigPage();

    const switchButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.acu-v2-sidebar button'))
      .find(button => (button.textContent || '').includes('切换到高手模式'));
    expect(switchButton).toBeDefined();
    switchButton!.click();
    await new Promise(r => setTimeout(r, 0));

    const sidebarText = document.querySelector('.acu-v2-sidebar')?.textContent || '';
    expect(sidebarText).toContain('高手模式');
    expect(sidebarText).toContain('仪表盘');
    expect(document.querySelector('.acu-v2-dashboard-page')).not.toBeNull();

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(persisted.uiMode.mode).toBe('advanced');
    expect(persisted.router.activePageId).toBe('dashboard');

    mount.__resetAcuV2MountForTests();
  });
});
