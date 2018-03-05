/**
 *  Header 
 */
(function ( $, undefined ) {

    // 设置头部搜索的 icon 的 top 值
    var $header = $('#header');
    var $searchIcon = $header.find('.header-search .glyphicon');
    $searchIcon.css({
        top: $header.height() / 2 - $searchIcon.height() / 2,
    });

    // 设置点击搜索 icon 使 input 输入框以动画显示
    

})(jQuery);
