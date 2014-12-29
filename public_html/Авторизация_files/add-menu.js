// jQuery from Bitrix core are loaded
$(function() {
    var SCRUMBAN = window.scrumban;
    var SITE_DIR = SCRUMBAN.SITE_DIR;
    var SITE_TEMPLATE  = SCRUMBAN.SITE_TEMPLATE ;
    var EXTRANET_SITE_ID = SCRUMBAN.scrumbanPageControllsConfig.EXTRANET_SITE_ID;
    var scrumbanProjectsEnabled = SCRUMBAN.scrumbanPageControllsConfig.SCRUMBAN_PROJECTS_ENABLED;
    var l10n = SCRUMBAN.scrumbanPageControllsConfig.l10n;

    var scrumbanPageControlls = {
        init: function() {
            if (this.isNeedAddWorkgroupLinks()) {
                this.addWorkgroupLinks();
            }

            if (this.isNeedAddTopIcon()) {
                this.addTopIcon();
            }

            if (this.isNeedAddTextLink()) {
                this.addTextLink();
            }

            if (this.isNeedAddTaskButton()) {
                this.addTaskButton();
            }
        },

        /**
         * Надо ли добавлять иконку в верхнее меню
         * @returns {Number|boolean}
         */
        isNeedAddTopIcon: function(){
            var $top = $('#header').find('#header-inner').find('.header-logo-block');
            var $sc = $top.find('.scrumban-head-informers');
            return ($top.length && !$sc.length);
        },

        /**
         * Надо ли добавлять ссылки на Скрамбан внутри битриксовых проектов
         * @returns {boolean}
         */
        isNeedAddWorkgroupLinks: function() {
            return (window.scrumban.scrumbanPageControllsConfig.WORKGROUP_ID !== false);
        },

        /**
         * Надо ли добавлять текстовую ссылку в меню
         * @returns {boolean}
         */
        isNeedAddTextLink: function() {
            var $link;
            var $leftMenu = $('#menu > .menu-favorites');

            if (!$leftMenu.length) {
                $leftMenu = $('#menu #bx_b24_menu > .menu-favorites');
            }

            if ($leftMenu.length) {
                $link = $leftMenu.find('a[href*=scrumban]');
                return !$link.length;
            } else {
                var $topMenu = $('#navigation-block').find('#top-menu-layout').find('#top-menu');
                if ($topMenu.length) {
                    $link = $topMenu.find('a[href*=scrumban]');
                    return !$link.length;
                }
            }
            return false;
        },

        /**
         * Надо ли добавлять кнопку перехода к задаче в скрамбане
         * @returns {boolean}
         */
        isNeedAddTaskButton: function(){
            return (window.scrumban.scrumbanPageControllsConfig.TASK_ID !== false);
        },

        /**
         * Добавить ссылку на задачу
         */
        addTaskButton: function() {
            var taskId = window.scrumban.scrumbanPageControllsConfig.TASK_ID;

            var url = SITE_DIR + 'scrumban/task/open/backendId/' + taskId;
            var button = '<a class="webform-small-button task-list-toolbar-scrumban" title="{goScrumban}" href="{url}">'
                    + '<span class="webform-small-button-left"></span>'
                    + '<span class="webform-small-button-icon"></span>'
                    + '<span class="webform-small-button-right"></span>'
                + '</a>'
                + '<span class="task-title-button-separator"></span>';

            button = button.replace('{url}', url).replace('{goScrumban}', l10n['SCRUMBAN_TASK']);

            if (SCRUMBAN.SITE_TEMPLATE == 'bitrix24') {
                $('.task-buttons').append(button);
            } else {
                $('.task-list-toolbar-actions').prepend(button);
            }
        },

        /**
         * Добавить ссылки на проект
         */
        addWorkgroupLinks: function () {
            var i, $obj, groupId = window.scrumban.scrumbanPageControllsConfig.WORKGROUP_ID;
            var workgroupLinks = [
                {
                    url:  SITE_DIR + 'scrumban/index/index/project/#groupId#/',
                    text: l10n['SCRUMBAN_TASK_BOARD']
                },
                {
                    url:  SITE_DIR + 'scrumban/planning/index/project/#groupId#/',
                    text: l10n['SCRUMBAN_PLANNING_BOARD']
                }
            ];

            if (SCRUMBAN.SITE_TEMPLATE == 'bitrix24') {
                $obj = $(".profile-menu-items");
                if (!$obj.length) {
                    $obj = $("#profile-menu-filter");
                }
            } else {
                $obj = $("#profile-menu-filter");
            }

            for (i = 0; i < workgroupLinks.length; i++) {
                workgroupLinks[i].url = workgroupLinks[i].url.replace('#groupId#', groupId);
            }

            for (i = 0; i < workgroupLinks.length; i++) {
                $obj.append(this.getWorkgroupLink(workgroupLinks[i].url, workgroupLinks[i].text));
            }
        },

        /**
         * Сгенерить ссылку в зависимости от используемого шаблона
         * @param url
         * @param text
         * @returns {string}
         */
        getWorkgroupLink: function(url, text) {
            if (SITE_TEMPLATE == "bitrix24") {
                return '<a href="' + url + '" class="filter-but-wrap">' +
                    '<span class="filter-but-left"></span><span class="filter-but-text-block">' + text + '</span>' +
                    '<span class="filter-but-right"></span></a>';
            } else {
                return '<a href="' + url + '" class="profile-menu-item">' +
                    '<span class="profile-menu-item-left"></span><span class="profile-menu-item-text">' + text + '</span>' +
                    '<span class="profile-menu-item-right"></span></a>'
            }
        },

        /**
         * Добавить иконку в верхнее меню
         */
        addTopIcon: function() {
            var styles = '<style>.scrumban-head-informers { padding: 5px 5px 4px; margin-top: 15px; vertical-align: top; border: 1px solid transparent; border-radius: 2px; display:inline-block; }.scrumban-head-informers:hover { border-color: #7c8491; border-top-color: #393d45; border-left-color: #393d45;  background-color: #424750; }</style>';
            $('head').append(styles);

            var image = '<img src="data:image/gif;base64,R0lGODlhEwAPAIABAKSst////yH5BAEAAAEALAAAAAATAA8AAAIrhI+pyxf/AIwzGHul05lr/G2eVY1dmIGYapbS1IrlLMMz3OTVzvf+DwwUAAA7" alt="">';
            var url = SITE_DIR + 'scrumban/index/all/';
            var dir = window.location.pathname;
            var parts = dir.match(/\/workgroups\/group\/(\d*)/i);
            if (parts && parts.length && parts[1]) {
                if (typeof scrumbanProjectsEnabled !== 'undefined') {
                    parts[1] = parseInt(parts[1], 10);
                    if (scrumbanProjectsEnabled.indexOf(parts[1]) !== -1) {
                        url = SITE_DIR + 'scrumban/index/index/project/' + parts[1];
                    }
                } else {
                    url = SITE_DIR + 'scrumban/index/index/project/' + parts[1];
                }
            }

            var $header = $('#header').find('#header-inner');
            var text = '<a href="' + url + '" class="scrumban-head-informers" title="' + l10n['SCRUMBAN_TASK_BOARD'] + '">' + image + '</a>';
            var $top = $header.find('.header-logo-block .header-informers-wrap');
            if (!$top.length) {
                $top = $header.find('.header-logo-block');
            }
            $top.append(text);
        },

        /**
         * Добавить текстовую ссылку в меню
         * @returns {boolean}
         */
        addTextLink: function () {
            var $after, $block;
            var url = SITE_DIR + 'scrumban/index/index/';
            var dir = window.location.pathname;
            var parts = dir.match(/\/workgroups\/group\/(\d*)/i);
            if (parts && parts.length && parts[1]) {
                if (typeof scrumbanProjectsEnabled !== 'undefined') {
                    parts[1] = parseInt(parts[1], 10);
                    if (scrumbanProjectsEnabled.indexOf(parts[1]) !== -1) {
                        url = SITE_DIR + 'scrumban/index/index/project/' + parts[1];
                    }
                } else {
                    url = SITE_DIR + 'scrumban/index/index/project/' + parts[1];
                }
            } else {
                if (SCRUMBAN.scrumbanPageControllsConfig.IS_EXTRANET) {
                    url += 'project/empty/site/' + EXTRANET_SITE_ID + '/';
                }
            }

            var $leftMenu = $('#menu > .menu-favorites');

            if (!$leftMenu.length) {
                $leftMenu = $('#menu #bx_b24_menu > .menu-favorites');
            }

            if ($leftMenu.length) {
                $after = $leftMenu.find('li:not(.menu-items-empty-li)').eq(0);
                $block = $after.clone();
                $block.removeClass('menu-item-active')
                    .find('a').attr('href', url)
                    .find('.menu-item-link-text').text(l10n.SCRUMBAN_TASK_BOARD);
                $after.after($block);
            } else {
                var $topMenu = $('#navigation-block').find('#top-menu-layout').find('#top-menu');
                if ($topMenu.length) {
                    $after = $topMenu.find('.root-item').eq(1);
                    $block = $after.clone();
                    $block.removeClass('home selected')
                        .prop("onmouseout", null)
                        .prop("onmouseover", null)
                        .removeAttr('onmouseout')
                        .removeAttr('onmouseover')
                        .removeAttr('id')
                        .find('a').attr('href', url)
                        .find('.root-item-text-line').text(l10n.SCRUMBAN_TASK_BOARD);
                    $after.before($block);
                }
            }
            return false;
        }
    };

    scrumbanPageControlls.init();
});
