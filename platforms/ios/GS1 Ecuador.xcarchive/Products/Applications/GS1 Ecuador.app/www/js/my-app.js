// Initialize your app
var myApp = new Framework7({
	modalTitle: 'GEPIR TOOL',
    animateNavBackIcon: true,
    // Enable templates auto precompilation
    precompileTemplates: true,
    // Enabled pages rendering using Template7
	swipeBackPage: true,
	pushState: true,
    template7Pages: true
});

// Export selectors engine
var $$ = Dom7;

//variables globales
var codigo = null;
var producto = null;
var latitud, longitud, pushId, tokenId;
var iosSettings = {};


// Add main View
var mainView = myApp.addView('.view-main', {
    // Enable dynamic Navbar
    dynamicNavbar: false,
});



function showModal(){
	myApp.modal({
	    title:  'GEPIR TOOL',
	    text: '<p style="text-align:justify;">'+
	  		'GEPIR TOOL es la herramienta que GS1 Ecuador '+
	       	'pone a disposici&oacute;n de todos sus afiliados '+
	        'y otros interesados que tengan la necesidad '+
	        'de consultar la empresa o nombre de producto '+
	        'asignado a un c&oacute;digo de barras.<br/>'+
	        'La b&uacute;squeda despliega s&oacute;lo informaci&oacute;n registrada en el Ecuador, por lo que si Ud. '+
	        'requiere buscar informaci&oacute;n de un c&oacute;digo asignado en otro pa&iacute;s visite www.gs1.org <br/>'+
	        'A trav&eacute;s de esta herramienta podr&aacute; realizar consultas por c&oacute;digo de producto (GTIN) o '+
	        'c&oacute;digo de localizaci&oacute;n (GLN).'+
	  	'</p>',
	    buttons: [
	      {
	        text: 'OK'
	      },
	    ]
	  });
}


function scan(action)
{

	console.log(action);
	if(action == 'getGTIN'){
		var page = 'gtin-result.html';
	}else if(action == 'getGLN'){
		var page = 'gln-result.html';
	}
	cordova.plugins.barcodeScanner.scan(

		function (result) {
            myApp.modal({
                title:  'GS1 Ecuador',
                text: 'Realizando consulta </br><img src="img/loading.gif" />'
            });
			  /*
	          alert("Lectura de barcode\n" +
	                "Resultados: " + result.text + "\n" +
	                "Formato: " + result.format + "\n" +
	                "Cancelado: " + result.cancelled);
	          */
	          codigo = result.text;
	          $.get( 'http://40.124.5.11/gs1app/productos', {'action':action, 'codigo':codigo}, function( data, status) {
	          		console.log(data);
	          		console.log(status);
	          		console.log(page);
		      		if(data.code === 0){
		      			myApp.closeModal();
		      			console.log(data);
		      			console.log(codigo);
		      			producto = data.producto[0];
		      			mainView.router.loadPage(page);
		      		}else{
                        myApp.closeModal();
		      			console.log(data.message);
                        myApp.modal({
                            title:  'GS1 Ecuador',
                            text: data.message,
                            buttons: [
                                {
                                    text: 'Entendido'
                                },
                            ]
                        });
		      		}
		        }, "json");
	    }, 
	    function (error) {
	          alert("Fallo al escanear: " + error);
	          mainView.router.loadPage("index.html");
	    }
   );
   
}

function rellenar(data){
	var producto = data;
	console.log(data);
	mainView.router.loadPage('about.html');
	$$('input#myInput').val(producto.descripcion);
}

$( document ).ready(function() {
	$(window).load(function() {
        document.addEventListener("deviceready",onDeviceReady,false);

		var options = {
			enableHighAccuracy: false
		};
        navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
        
	});
});

function onDeviceReady() {
    console.log(device.cordova);
    //$('#btnSolicitarServicio').html('Por favor espere...').attr('disabled',false);

    iosSettings["kOSSettingsKeyAutoPrompt"] = true;
    iosSettings["kOSSettingsKeyInAppLaunchURL"] = false;
    // Initialize
    window.plugins.OneSignal
        .startInit("a3f7bc9e-1357-4604-b642-e2511f624dcc")
        .iOSSettings(iosSettings)
        .endInit();

    window.plugins.OneSignal.registerForPushNotifications();

    window.plugins.OneSignal.getIds(function(ids) {
        console.log('getIds: ' + JSON.stringify(ids));
        //alert("userId = " + ids.userId + ", pushToken = " + ids.pushToken);
        pushId = ids.userId;
        tokenId = ids.pushToken;

        jQuery.ajax({
            url: "http://40.124.5.11/gs1app/pushregistration",
            type: "GET",
            dataType: "jsonp",
            contentType: "application/x-www-form-urlencoded",
            data: {
                action: 'register',
                latitud: latitud,
                longitud: longitud,
                imei: device.uuid,
                push: pushId,
                token: tokenId
            },
            success: function (result) {
                console.log(result);
            }
        });
    });
}

function onSuccess(position) {
	 latitud = position.coords.latitude;
	 longitud = position.coords.longitude;
	 console.log(latitud);
	 console.log(longitud);
}

function onError(error) {
	 var errString = '';
	 // Check to see if we have received an error code
	 if(error.code) {
		 // If we have, handle it by case
		 switch(error.code)
		 {
		 	case 1: // PERMISSION_DENIED
		 		errString =
				 'Ha sido imposible obtener info acerca de tu localizacion ' +
				 'porque el dispositivo no tiene permisos o no esta activado '+
				 'el GPS en tu telefono.';
				 break;
		 	case 2: // POSITION_UNAVAILABLE
				 errString =
				 'Ha sido imposible obtener info acerca de tu localizacion ' +
				 'porque la localizacion del dispositivo no ha podido se ' +
				 'determinada.';
				 break;
		 	case 3: // TIMEOUT
				 errString =
				 'Ha sido imposible obtener la localizacion denttro ' +
				 'del periodo determinado.';
				 break;
			default: // UNKOWN_ERROR
				errString =
					'Ha sido imposible obtener la localizacion del dispositivo ' +
					'debido a un error desconocido.';
				break;
	 	}
	 }
	 
	 navigator.notification.alert(
		errString,  // message
	    cerrarRestaurant(),         // callback
	    'Acerca de tu localizacion',            // title
	    'OK'                  // buttonName
	 );
}

$$('#modal-info').on('click', function () {
  showModal();
});

function searchGtin(){
	var dataform = myApp.formGetData('codigo_gtin');
	console.log(dataform);
    myApp.modal({
        title:  'GS1 Ecuador',
        text: 'Realizando consulta </br><img src="img/loading.gif" />'
    });
	$.get( 'http://40.124.5.11/gs1app/productos', {'action':'getCodigo', 'codigo':dataform.codigo}, function( data, status) {
  		if(data.code === 0){
  			myApp.closeModal();
  			console.log(data);
  			producto = data.producto[0];
  			mainView.router.loadPage('gtin-result.html');
  		}else{
  			myApp.closeModal();
  			console.log(data.message);
            myApp.modal({
                title:  'GS1 Ecuador',
                text: data.message,
                buttons: [
                    {
                        text: 'Entendido'
                    },
                ]
            });
  		}
    }, "json");
	$$('#codigo').val('');
}

function searchGln(){
    myApp.modal({
        title:  'GS1 Ecuador',
        text: 'Realizando consulta </br><img src="img/loading.gif" />'
    });
	var dataform = myApp.formGetData('codigo_gln');
	console.log(dataform);
	
	$.get( 'http://40.124.5.11/gs1app/localizacion', {'action':'getCodigo', 'codigo':dataform.codigogln}, function( data, status) {
  		if(data.code === 0){
            myApp.closeModal();
  			console.log(data);
  			gln = data.localizacion[0];
  			mainView.router.loadPage('gln-result.html');
  			producto = null;
  		}else{
            myApp.closeModal();
            console.log(data.message);
            myApp.modal({
                title:  'GS1 Ecuador',
                text: data.message,
                buttons: [
                    {
                        text: 'Entendido'
                    },
                ]
            });
  		}
    }, "json");
	$$('#codigogln').val('');
}

function buscarPorCodigo(){
	mainView.router.loadPage('gpir-ini.html');
	$$('#codigogln').val('');
	$$('#codigo').val('');
}

function getGln(){
	mainView.router.loadPage('gln-result.html');
}



myApp.onPageInit('gln-result', function (page) {
	mapRest = L.map('mapSelect');
	$$(document).on('pageBack', function (e) {
	  // Do something here when page loaded and initialized
		mainView.router.loadPage('index.html');
	});
	if(producto !== null){
		cliente = producto.cliente;
		gln = producto.gln;
		console.log(cliente);
		console.log(producto);
		$("#company").html(cliente.nomcli);
		$("#nro-gln").html(gln.gln);

		var glnNumber = gln.gln;
		var control = glnNumber.substring(3, 4);
		console.log(control);
		if(control == 1){
			var sufijo = glnNumber.substring(0, 8);
			console.log(sufijo);
			$("#nro-gcp").html(sufijo);
		}else if(control == 2){
			var sufijo = glnNumber.substring(0, 9);
			console.log(sufijo);
			$("#nro-gcp").html(sufijo);
		}else if(control == 8){
			var sufijo = glnNumber.substring(0, 11);
			console.log(sufijo);
			$("#nro-gcp").html(sufijo);
		}


		if(cliente.representante === '' || cliente.representante === null){
			$("#com-representante").html('No Disponible');
		}else{
			$("#com-representante").html(cliente.representante);
		}

		if(cliente.telcli === '' || cliente.telcli === null){
			$("#com-telefono").html('No Disponible');
		}else{
			$("#com-telefono").html(cliente.telcli);
		}

		if(cliente.email === '' || cliente.email === null){
			$("#com-email").html('No Disponible');
		}else{
			$("#com-email").html(cliente.email);
		}

		if(cliente.dircli === '' || cliente.dircli === null){
			$("#des_direccion").html('No Disponible');
		}else{
			$("#des_direccion").html(cliente.dircli);
		}

		if(cliente.web === '' || cliente.web === null){
			$("#com-web").html('No Disponible');
		}else{
			$("#com-web").html(cliente.web);
		}
		
		if(cliente.ruccli === '' || cliente.ruccli === null){
			$("#com-ruc").html('No Disponible');
		}else{
			$("#com-ruc").html(cliente.ruccli);
		}
		
		if(gln.latitud === null || gln.latitud === ''){
			$("#latitud").html('No Disponible');
		}else{
			$("#latitud").html(gln.latitud);
		}

		if(gln.longitud === null || gln.longitud === ''){
			$("#longitud").html('No Disponible');
		}else{
			$("#longitud").html(gln.longitud);
			verMapa(gln.latitud, gln.longitud);
		}

		//verMapa(latitud, longitud);
		if(gln.europa === null || gln.europa === ''){
			$("#europa").html('No Disponible');
		}else{
			$("#europa").html(gln.europa);
		}

		if(gln.global === null || gln.global === ''){
			$("#global").html('No Disponible');
		}else{
			$("#global").html(gln.global);
		}
		
		if(gln.cod_tiploc === null || gln.cod_tiploc === ''){
			$("#tipo").html('No Disponible');
		}else{
			$("#tipo").html(gln.cod_tiploc);
		}
		
		if(gln.cod_loc === null || gln.cod_loc === ''){
			$("#com-localizacion").html('No Disponible');
		}else{
			$("#com-localizacion").html(gln.cod_loc);
		}

		prov = producto.provincia;
		console.log(prov);
		if(prov.descripcion === null || prov.descripcion === ''){
			$("#provincia").html('No Disponible');
		}else{
			console.log(prov.descripcion);
			$("#des_provincia").html(prov.descripcion);
		}
		ciudad = producto.ciudad;
		console.log(ciudad);
		if(ciudad === null || ciudad === ''){
			$("#des_ciudad").html('No Disponible');
		}else{
			$("#des_ciudad").html(ciudad.descripcion);
		}
		canton = producto.canton;
		console.log(canton);
		if(canton === null || canton === ''){
			$("#des_canton").html('No Disponible');
		}else{
			$("#des_canton").html(canton.descripcion);
		}
		console.log(producto);
	}else{
		cliente = gln.cliente;
		console.log(gln);
		$("#company").html(cliente.nomcli);
		$("#nro-gln").html(gln.gln);

		var glnNumber = gln.gln;
		var control = glnNumber.substring(3, 4);
		console.log(control);
		if(control == 1){
			var sufijo = glnNumber.substring(0, 8);
			console.log(sufijo);
			$("#nro-gcp").html(sufijo);
		}else if(control == 2){
			var sufijo = glnNumber.substring(0, 9);
			console.log(sufijo);
			$("#nro-gcp").html(sufijo);
		}else if(control == 8){
			var sufijo = glnNumber.substring(0, 11);
			console.log(sufijo);
			$("#nro-gcp").html(sufijo);
		}

		if(cliente.representante === '' || cliente.representante === null){
			$("#com-representante").html('No Disponible');
		}else{
			$("#com-representante").html(cliente.representante);
		}
		
		if(gln.cod_loc === null || gln.cod_loc === ''){
			$("#com-localizacion").html('No Disponible');
		}else{
			$("#com-localizacion").html(gln.cod_loc);
		}
		
		if(gln.cod_tiploc === null || gln.cod_tiploc === ''){
			$("#tipo").html('No Disponible');
		}else{
			$("#tipo").html(gln.cod_tiploc);
		}
		
		if(cliente.telcli === '' || cliente.telcli === null){
			$("#com-telefono").html('No Disponible');
		}else{
			$("#com-telefono").html(cliente.telcli);
		}
		if(cliente.email === '' || cliente.email === null){
			$("#com-email").html('No Disponible');
		}else{
			$("#com-email").html(cliente.email);
		}
		
		if(cliente.ruccli === '' || cliente.ruccli === null){
			$("#com-ruc").html('No Disponible');
		}else{
			$("#com-ruc").html(cliente.ruccli);
		}
		
		if(cliente.web === '' || cliente.web === null){
			$("#com-web").html('No Disponible');
		}else{
			$("#com-web").html(cliente.web);
		}
		
		if(gln.latitud === null || gln.latitud === ''){
			$("#latitud").html('No Disponible');
		}else{
			$("#latitud").html(gln.latitud);
		}

		if(gln.longitud === null || gln.longitud === ''){
			$("#longitud").html('No Disponible');
		}else{
			$("#longitud").html(gln.longitud);
			verMapa(gln.latitud, gln.longitud);
		}
		
		if(gln.europa === null || gln.europa === ''){
			$("#europa").html('No Disponible');
		}else{
			$("#europa").html(gln.europa);
		}

		if(gln.global === null || gln.global === ''){
			$("#global").html('No Disponible');
		}else{
			$("#global").html(gln.global);
		}

		if(cliente.dircli === null || cliente.dircli === ''){
			$("#des_direccion").html('No Disponible');
		}else{
			$("#des_direccion").html(cliente.dircli);
		}
		
		provincia = gln.provincia;
		console.log(provincia);
		if(provincia === null || provincia === ''){
			$("#des_provincia").html('No Disponible');
		}else{
			$("#des_provincia").html(provincia.descripcion);
		}
		ciudad = gln.ciudad;
		console.log(ciudad);
		if(ciudad === null || ciudad === ''){
			$("#des_ciudad").html('No Disponible');
		}else{
			$("#des_ciudad").html(ciudad.descripcion);
		}
		canton = gln.canton;
		console.log(canton);
		if(canton === null || canton === ''){
			$("#des_canton").html('No Disponible');
		}else{
			$("#des_canton").html(canton.descripcion);
		}
	}
});

function verMapa(lat, lon){
	console.log(lat);
	$("#mapSelect").empty();
	$.get( 'http://nominatim.openstreetmap.org/reverse?', {
		'format':'json',
		'lat':lat,
		'lon':lon,
		'zoom':17,
		'addressdetails':1
		}, function( data ) {
			console.log(data);
			bbox1 = data.boundingbox[1];
			bbox2 = data.boundingbox[3];
			bbox3 = data.boundingbox[0];
			bbox4 = data.boundingbox[2];
			console.log(bbox1);
			console.log(bbox2);
			console.log(bbox3);
			console.log(bbox4);
			$("#mapSelect").html(
				'<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="http://www.openstreetmap.org/export/embed.html?bbox='+bbox4+'%2C'+bbox3+'%2C'+bbox2+'%2C'+bbox1+'&amp;layer=mapnik&amp;marker='+lat+'%2C'+lon+'"></iframe><br/>'
			);
	}, "json");
}

myApp.onPageInit('gtin-result', function (page) {
	if(producto !== null){
		
		$("#product-description").html(producto.despro);
		$("#largo").html(producto.largo);
		$("#peso").html(producto.peso);
		$("#ancho").html(producto.ancho);
		$("#espesor").html(producto.espesor);
		$("#codbar").html(producto.codbar);
		
		$("#ciudad").html(producto.ciudad.descripcion);
		$("#canton").html(producto.canton.descripcion);
		$("#provincia").html(producto.provincia.descripcion);
		$("#direccion").html(producto.cliente.dircli);
		
		if(producto.foto !== null){
			foto = producto.foto;
			$("#imagen_producto").attr('src', foto);
		}
		
		cliente = producto.cliente;
		gln = producto.gln;
		categoria = producto.categoria;
		console.log(cliente);

		var glnNumber = gln.gln;
		var control = glnNumber.substring(3, 4);
		console.log(control);
		if(control == 1){
			var sufijo = glnNumber.substring(0, 8);
			console.log(sufijo);
			$("#gcp").html(sufijo);
		}else if(control == 2){
			var sufijo = glnNumber.substring(0, 9);
			console.log(sufijo);
			$("#gcp").html(sufijo);
		}else if(control == 8){
			var sufijo = glnNumber.substring(0, 11);
			console.log(sufijo);
			$("#gcp").html(sufijo);
		}

		if(cliente.representante === ''){
			$("#representante").html('No Disponible');
		}else{
			$("#representante").html(cliente.representante);
		}
		if(cliente.email === ''){
			$("#email").html('No Disponible');
		}else{
			$("#email").html(cliente.email);
		}
		if(cliente.telcli === ''){
			$("#telefono").html('No Disponible');
		}else{
			$("#telefono").html(cliente.telcli);
		}
		if(cliente.web === ''){
			$("#web").html('No Disponible');
		}else{
			$("#web").html(cliente.web);
		}
		if(cliente.telcli === ''){
			$("#telefono").html('No Disponible');
		}else{
			$("#telefono").html(cliente.telcli);
		}
		$("#empresa").html(cliente.nomcli);
		$("#gln").html('<a href="" onclick="getGln()">' + gln.gln + '</a>');
		$("#codpro").html(categoria.descripcion);
		$("#feccre").html(producto.feccre);
		console.log(producto);
	}
});



$$(document).on('pageInit', function (e) {
	$(".swipebox").swipebox();
	$(".videocontainer").fitVids();
	
	$("#ContactForm").validate({
		submitHandler: function(form) {
			ajaxContact(form);
			return false;
		}
	});
	
	
	//$$('input#myInput').val(producto.descripcion);

	$(".posts li").hide();	
	size_li = $(".posts li").size();
	x=3;
	$('.posts li:lt('+x+')').show();
	$('#loadMore').click(function () {
		x= (x+1 <= size_li) ? x+1 : size_li;
		$('.posts li:lt('+x+')').show();
		if(x == size_li){
			$('#loadMore').hide();
			$('#showLess').show();
		}
	});

	$("a.switcher").bind("click", function(e){
		e.preventDefault();
		
		var theid = $(this).attr("id");
		var theproducts = $("ul#photoslist");
		var classNames = $(this).attr('class').split(' ');
		
		
		if($(this).hasClass("active")) {
			// if currently clicked button has the active class
			// then we do nothing!
			return false;
		} else {
			// otherwise we are clicking on the inactive button
			// and in the process of switching views!

  			if(theid == "view13") {
				$(this).addClass("active");
				$("#view11").removeClass("active");
				$("#view11").children("img").attr("src","img/switch_11.png");
				
				$("#view12").removeClass("active");
				$("#view12").children("img").attr("src","img/switch_12.png");
			
				var theimg = $(this).children("img");
				theimg.attr("src","img/switch_13_active.png");
			
				// remove the list class and change to grid
				theproducts.removeClass("photo_gallery_11");
				theproducts.removeClass("photo_gallery_12");
				theproducts.addClass("photo_gallery_13");

			}
			
			else if(theid == "view12") {
				$(this).addClass("active");
				$("#view11").removeClass("active");
				$("#view11").children("img").attr("src","img/switch_11.png");
				
				$("#view13").removeClass("active");
				$("#view13").children("img").attr("src","img/switch_13.png");
			
				var theimg = $(this).children("img");
				theimg.attr("src","img/switch_12_active.png");
			
				// remove the list class and change to grid
				theproducts.removeClass("photo_gallery_11");
				theproducts.removeClass("photo_gallery_13");
				theproducts.addClass("photo_gallery_12");

			} 
  			
			else if(theid == "view11") {
				$("#view12").removeClass("active");
				$("#view12").children("img").attr("src","img/switch_12.png");
				
				$("#view13").removeClass("active");
				$("#view13").children("img").attr("src","img/switch_13.png");
			
				var theimg = $(this).children("img");
				theimg.attr("src","img/switch_11_active.png");
			
				// remove the list class and change to grid
				theproducts.removeClass("photo_gallery_12");
				theproducts.removeClass("photo_gallery_13");
				theproducts.addClass("photo_gallery_11");
			} 
		}
	});	
	
	document.addEventListener('touchmove', function(event) {
	   if(event.target.parentNode.className.indexOf('navbarpages') != -1 || event.target.className.indexOf('navbarpages') != -1 ) {
		   event.preventDefault();
	   }
	}, false);

});

function modalSalir()
{
	myApp.modal({
	    title:  'Salir de la App',
	    text: '<p style="text-align:justify;">Esta seguro de que quiere cerrar la App?</p>',
	    buttons: [
	      {
	        text: 'OK',
	        onClick: function() {
	            exitFromApp();
	        }
	      },
	      {
	        text: 'NO',
	        onClick: function() {
	        	mainView.router.loadPage("index.html");
	        }
	      },
	    ]
	});
}

function exitFromApp()
{
	navigator.app.exitApp();
}


