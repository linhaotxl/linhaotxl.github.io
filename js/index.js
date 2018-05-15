
(function ( $, undefined ) {

    var $sidebarNav  = $( '#sidebar_nav' );                     // 获取 Sidebar Nav 
    var $sidebarMask = $( '#sidebar_nav_mask' );                // 获取 Sidebar Nav 下面的 Mask
    var $sidebarBtn = $( '.sidebar_nav_btn' );                  // 获取导航树的按钮
    var $sidebarBtnIcon  = $sidebarBtn.find( '.iconfont' );     // 获取点击 Sidebar Nav 的按钮
    var isClickSidebarNavBtn = false;                           // 是否点击了导航树的按钮
    var settings = {                                            // 导航树的配置信息
        view: {
            showLine: false,
            selectedMulti: false,
            dblClickExpand: false,
        },

        data: {
            simpleData : {  
                enable : true,  
                idKey : "id",
                pIdKey : "pid",
                rootPId : 0,
            }  
        },

        callback: {
            onClick: handlerClickTreeNode
        }
    };
    var treeNodes = [];

    /**
     *  初始化头部
     */
    // 设置点击搜索 icon 使 input 输入框以动画显示
    function initHeader () {
        var $header = $('#header');
        var $searchIcon = $header.find('.header-search .iconfont');
        var $searchFormGroup = $header.find('.form-group'); 
        var $searchInput = $header.find('.form-item');
        $searchIcon.on('click', function () {
            if ( $searchFormGroup.width() === 0 ) {
                $searchFormGroup.css( 'width', '100%' );
                $searchIcon.css( 'color', '#ea833e' );
                $searchInput.focus();
            } else {
                $searchFormGroup.css( 'width', 0 );
                $searchIcon.css( 'color', '#333' );
            }
        });
    
        $searchInput.on('keyup', function ( e ) {
            if ( e.keyCode === 13 ) {
                var $search = $('#search');
                $search.find('.search-item').remove();
    
                if ( !e.target.value ) {
                    $search.hide();
                    return ;
                }
    
                $('<div>')
                .attr({
                    class: 'search-item AGaramondPro_Bold'
                })
                .html( 'Search Results for: ' + e.target.value )
                .appendTo( $search );
                $search.css('display', 'flex');
            }
    
            return false;
        });
    
        $searchInput.on('blur', function ( e ) {
            $searchFormGroup.css( 'width', 0 );
            $searchIcon.css( 'color', '#333' );
        });
    }

    /**
     *  初始化头部进度条
     */
    function initHeaderScroll () {
        var $headerScrollBlock = $('.header_scroll_block');
        var $doc = $( document );
        var $win = $( window );
        var winHeight = $win.height();
        var scrollValue = ($doc.scrollTop()) / ($doc.height() - winHeight);
        updateProgressValue( scrollValue );

        $win.on('scroll', function () {
            scrollValue = ($doc.scrollTop()) / ($doc.height() - winHeight);
            updateProgressValue( scrollValue );
        });

        function updateProgressValue ( value ) {
            $headerScrollBlock.css( 'width', (value * 100) + '%' );
        }
    }

    /**
     *  Header Sidebar Nav Btn
     */
    // function toggleWindowScroll ( state ) {
    //     var $win = $( window );
    //     console.log( state )
    //     if ( state ) {
    //         console.log('禁止滚动')
    //         $( 'html, body' ).on( 'mousewheel', _stop );
    //         // $win.on( 'DOMMouseScroll', _stop );
    //     } else {
    //         console.log('开启滚动')
    //         $( 'html, body' ).off( 'mousewheel', _stop );
    //         // $win.off( 'DOMMouseScroll', _stop );
    //     }

    //     function _stop ( e ) {
    //         return false;
    //     }
    // }

    /**
     *  Sidebar Nav Show
     */
    function showSidebarNav () {
        isClickSidebarNavBtn = true;
        $sidebarMask.fadeIn(200);
        $sidebarNav.addClass( 'slideInRight' ).removeClass( 'slideOutRight' );
        $sidebarBtnIcon.removeClass('icon-menu2').addClass('sidebar_nav_btn_animation icon-shezhi');
        setTimeout(function () {
            $sidebarBtnIcon.removeClass('icon-shezhi sidebar_nav_btn_animation').addClass('icon-qianjin');
        }, 200);
    }

    /**
     *  Sidebar Nav Hide
     */
    function hideSidebarNav () {
        isClickSidebarNavBtn = false;
        $sidebarMask.fadeOut(200);
        $sidebarNav.addClass( 'slideOutRight' ).removeClass( 'slideInRight' );
        $sidebarBtnIcon.removeClass('icon-qianjin').addClass('sidebar_nav_btn_animation icon-shezhi');
        setTimeout(function () {
            $sidebarBtnIcon.removeClass('icon-shezhi sidebar_nav_btn_animation').addClass('icon-menu2');
        }, 200);
    }

    /**
     *  初始化点击头部按钮
     */
    function initHeaderSidebarBtn () {

        $sidebarBtn.on('click', function () {
            if ( isClickSidebarNavBtn ) {
                hideSidebarNav();
            } else {
                showSidebarNav();
            }
        });

        $sidebarMask.on('click', function () {
            hideSidebarNav()
        });
    }

    /**
     *  将扁平化的数据转换为属性结构
     */
    function convertTreeWithArray ( arr ) {  
        let temp = {};  
        let res = [];  
        for( let i in arr ) {  
            temp[ arr[i].id ] = arr[i];  
        }  
        
        for( let i in temp ) {  
            if( temp[i].pid !== '0' ) {  
                if( !temp[temp[i].pid].children ) {  
                    temp[temp[i].pid].children = [];  
                }  
                temp[temp[i].pid].children.push( temp[i] );  
            } else {  
                res.push( temp[i] );  
            }
        }  
        console.log( res )
        return res;  
    }

    /**
     *  点击节点
     */
    function handlerClickTreeNode ( e, treeId, treeNode ) {
        $( 'html, body' ).animate({
            scrollTop: treeNode.top
        }, 200);
        hideSidebarNav();
    }

    /**
     *  初始化 Sidebar Nav 内容
     */
    function initHeaderSidebarContent () {
        var _data = [];
        var $listItem = $( 'h2[id], h3[id], h4[id], h5[id]' );
        var h2Index = 1;
        var h3Index = 1;
        var h4Index = 1;
        var h5Index = 1;
        $listItem.each(function ( index, el ) {
            var id  = '';
            var pid = '';
            var $el = $( el );
            if( $.nodeName( el , 'h2' ) ) {
                id = h2Index + '';
                pid = '0';
                h2Index++;
                h3Index = 1;
                h4Index = 1;
            } else if ( $.nodeName( el , 'h3' ) ) {
                var tem = h2Index - 1;
                id = tem + '_' + h3Index;
                pid = tem + '';
                h3Index++;
                h4Index = 1;
            } else if ( $.nodeName( el , 'h4' ) ) {
                var tem = h3Index - 1;
                var temH2 = h2Index - 1;
                id = temH2 + '_' + tem + '_' + h4Index;
                pid = temH2 + '_' + tem;
                h4Index++;
            } else if ( $.nodeName( el , 'h5' ) ) {
                var tem = h3Index - 1;
                var temH2 = h2Index - 1;
                var temH4 = h4Index - 1;
                id = temH2 + '_' + tem + '_' + temH4 + '_' + h5Index;
                pid = temH2 + '_' + tem + '_' + temH4;
                h5Index++;
            }
            
            _data.push({
                id: id,
                pid: pid,
                name: $el.find('a').attr( 'title' ),
                top: $el.offset().top - 10
            });
        });
        
        $.fn.zTree.init( $('#tree_nav'), settings, convertTreeWithArray( _data ) );
        
        var $tree = $.fn.zTree.getZTreeObj( 'tree_nav' );
        if ( $tree ) {
            $tree.expandAll( true );
        }
    }

    /**
     *  设置 Sidebar Nav 的展开/收缩箭头
     */
    function initSidebarArrow () {
        console.log( $('.button.noline_open') )
        // $('.button.noline_open').addClass( 'glyphicon glyphicon-menu-down' )
    }

    $(function () {

        initHeader();
        initHeaderScroll();
        initHeaderSidebarBtn();
        initSidebarArrow();

        setTimeout(function () {
            initHeaderSidebarContent();
        }, 0);

    });

})( jQuery );
