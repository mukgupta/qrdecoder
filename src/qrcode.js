/*
   Copyright 2011 Lazar Laszlo (lazarsoft@gmail.com, www.lazarsoft.info)
   
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


qrdecoder = {};
qrdecoder.imagedata = null;
qrdecoder.width = 0;
qrdecoder.height = 0;
qrdecoder.qrdeCoderSymbol = null;
qrdecoder.debug = false;
qrdecoder.maxImgSize = 1024*1024;

qrdecoder.sizeOfDataLengthInfo =  [  [ 10, 9, 8, 8 ],  [ 12, 11, 16, 10 ],  [ 14, 13, 16, 12 ] ];

qrdecoder.callback = null;

qrdecoder.decode = function(src){
    
    if(arguments.length==0)
    {
        var canvas_qr = document.getElementById("qr-canvas");
        var context = canvas_qr.getContext('2d');
        qrdecoder.width = canvas_qr.width;
        qrdecoder.height = canvas_qr.height;
        qrdecoder.imagedata = context.getImageData(0, 0, qrdecoder.width, qrdecoder.height);
        qrdecoder.result = qrdecoder.process(context);
        if(qrdecoder.callback!=null)
            qrdecoder.callback(qrdecoder.result);
        return qrdecoder.result;
    }
    else
    {
        var image = new Image();
        image.onload=function(){
            //var canvas_qr = document.getElementById("qr-canvas");
            var canvas_qr = document.createElement('canvas');
            var context = canvas_qr.getContext('2d');
            var nheight = image.height;
            var nwidth = image.width;
            if(image.width*image.height>qrdecoder.maxImgSize)
            {
                var ir = image.width / image.height;
                nheight = Math.sqrt(qrdecoder.maxImgSize/ir);
                nwidth=ir*nheight;
            }

            canvas_qr.width = nwidth;
            canvas_qr.height = nheight;
            
            context.drawImage(image, 0, 0, canvas_qr.width, canvas_qr.height );
            qrdecoder.width = canvas_qr.width;
            qrdecoder.height = canvas_qr.height;
            try{
                qrdecoder.imagedata = context.getImageData(0, 0, canvas_qr.width, canvas_qr.height);
            }catch(e){
                qrdecoder.result = "Cross domain image reading not supported in your browser! Save it to your computer then drag and drop the file!";
                if(qrdecoder.callback!=null)
                    qrdecoder.callback(qrdecoder.result);
                return;
            }
            
            try
            {
                qrdecoder.result = qrdecoder.process(context);
            }
            catch(e)
            {
                console.log(e);
                qrdecoder.result = "error decoding QR Code";
            }
            if(qrdecoder.callback!=null)
                qrdecoder.callback(qrdecoder.result);
        }
        image.src = src;
    }
}

qrdecoder.isUrl = function(s)
{
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(s);
}

qrdecoder.decode_url = function (s)
{
  var escaped = "";
  try{
    escaped = escape( s );
  }
  catch(e)
  {
    console.log(e);
    escaped = s;
  }
  var ret = "";
  try{
    ret = decodeURIComponent( escaped );
  }
  catch(e)
  {
    console.log(e);
    ret = escaped;
  }
  return ret;
}

qrdecoder.decode_utf8 = function ( s )
{
    if(qrdecoder.isUrl(s))
        return qrdecoder.decode_url(s);
    else
        return s;
}

qrdecoder.process = function(ctx){
    
    var start = new Date().getTime();

    var image = qrdecoder.grayScaleToBitmap(qrdecoder.grayscale());
    //var image = qrdecoder.binarize(128);
    
    if(qrdecoder.debug)
    {
        for (var y = 0; y < qrdecoder.height; y++)
        {
            for (var x = 0; x < qrdecoder.width; x++)
            {
                var point = (x * 4) + (y * qrdecoder.width * 4);
                qrdecoder.imagedata.data[point] = image[x+y*qrdecoder.width]?0:0;
                qrdecoder.imagedata.data[point+1] = image[x+y*qrdecoder.width]?0:0;
                qrdecoder.imagedata.data[point+2] = image[x+y*qrdecoder.width]?255:0;
            }
        }
        ctx.putImageData(qrdecoder.imagedata, 0, 0);
    }
    
    //var finderPatternInfo = new FinderPatternFinder().findFinderPattern(image);
    
    var detector = new Detector(image);

    var qRdeCoderMatrix = detector.detect();
    
    /*for (var y = 0; y < qRdeCoderMatrix.bits.Height; y++)
    {
        for (var x = 0; x < qRdeCoderMatrix.bits.Width; x++)
        {
            var point = (x * 4*2) + (y*2 * qrdecoder.width * 4);
            qrdecoder.imagedata.data[point] = qRdeCoderMatrix.bits.get_Renamed(x,y)?0:0;
            qrdecoder.imagedata.data[point+1] = qRdeCoderMatrix.bits.get_Renamed(x,y)?0:0;
            qrdecoder.imagedata.data[point+2] = qRdeCoderMatrix.bits.get_Renamed(x,y)?255:0;
        }
    }*/
    if(qrdecoder.debug)
        ctx.putImageData(qrdecoder.imagedata, 0, 0);
    
    var reader = Decoder.decode(qRdeCoderMatrix.bits);
    var data = reader.DataByte;
    var str="";
    for(var i=0;i<data.length;i++)
    {
        for(var j=0;j<data[i].length;j++)
            str+=String.fromCharCode(data[i][j]);
    }
    
    var end = new Date().getTime();
    var time = end - start;
    console.log(time);
    
    return qrdecoder.decode_utf8(str);
    //alert("Time:" + time + " Code: "+str);
}

qrdecoder.getPixel = function(x,y){
    if (qrdecoder.width < x) {
        throw "point error";
    }
    if (qrdecoder.height < y) {
        throw "point error";
    }
    point = (x * 4) + (y * qrdecoder.width * 4);
    p = (qrdecoder.imagedata.data[point]*33 + qrdecoder.imagedata.data[point + 1]*34 + qrdecoder.imagedata.data[point + 2]*33)/100;
    return p;
}

qrdecoder.binarize = function(th){
    var ret = new Array(qrdecoder.width*qrdecoder.height);
    for (var y = 0; y < qrdecoder.height; y++)
    {
        for (var x = 0; x < qrdecoder.width; x++)
        {
            var gray = qrdecoder.getPixel(x, y);
            
            ret[x+y*qrdecoder.width] = gray<=th?true:false;
        }
    }
    return ret;
}

qrdecoder.getMiddleBrightnessPerArea=function(image)
{
    var numSqrtArea = 4;
    //obtain middle brightness((min + max) / 2) per area
    var areaWidth = Math.floor(qrdecoder.width / numSqrtArea);
    var areaHeight = Math.floor(qrdecoder.height / numSqrtArea);
    var minmax = new Array(numSqrtArea);
    for (var i = 0; i < numSqrtArea; i++)
    {
        minmax[i] = new Array(numSqrtArea);
        for (var i2 = 0; i2 < numSqrtArea; i2++)
        {
            minmax[i][i2] = new Array(0,0);
        }
    }
    for (var ay = 0; ay < numSqrtArea; ay++)
    {
        for (var ax = 0; ax < numSqrtArea; ax++)
        {
            minmax[ax][ay][0] = 0xFF;
            for (var dy = 0; dy < areaHeight; dy++)
            {
                for (var dx = 0; dx < areaWidth; dx++)
                {
                    var target = image[areaWidth * ax + dx+(areaHeight * ay + dy)*qrdecoder.width];
                    if (target < minmax[ax][ay][0])
                        minmax[ax][ay][0] = target;
                    if (target > minmax[ax][ay][1])
                        minmax[ax][ay][1] = target;
                }
            }
            //minmax[ax][ay][0] = (minmax[ax][ay][0] + minmax[ax][ay][1]) / 2;
        }
    }
    var middle = new Array(numSqrtArea);
    for (var i3 = 0; i3 < numSqrtArea; i3++)
    {
        middle[i3] = new Array(numSqrtArea);
    }
    for (var ay = 0; ay < numSqrtArea; ay++)
    {
        for (var ax = 0; ax < numSqrtArea; ax++)
        {
            middle[ax][ay] = Math.floor((minmax[ax][ay][0] + minmax[ax][ay][1]) / 2);
            //Console.out.print(middle[ax][ay] + ",");
        }
        //Console.out.println("");
    }
    //Console.out.println("");
    
    return middle;
}

qrdecoder.grayScaleToBitmap=function(grayScale)
{
    var middle = qrdecoder.getMiddleBrightnessPerArea(grayScale);
    var sqrtNumArea = middle.length;
    var areaWidth = Math.floor(qrdecoder.width / sqrtNumArea);
    var areaHeight = Math.floor(qrdecoder.height / sqrtNumArea);
    var bitmap = new Array(qrdecoder.height*qrdecoder.width);
    
    for (var ay = 0; ay < sqrtNumArea; ay++)
    {
        for (var ax = 0; ax < sqrtNumArea; ax++)
        {
            for (var dy = 0; dy < areaHeight; dy++)
            {
                for (var dx = 0; dx < areaWidth; dx++)
                {
                    bitmap[areaWidth * ax + dx+ (areaHeight * ay + dy)*qrdecoder.width] = (grayScale[areaWidth * ax + dx+ (areaHeight * ay + dy)*qrdecoder.width] < middle[ax][ay])?true:false;
                }
            }
        }
    }
    return bitmap;
}

qrdecoder.grayscale = function(){
    var ret = new Array(qrdecoder.width*qrdecoder.height);
    for (var y = 0; y < qrdecoder.height; y++)
    {
        for (var x = 0; x < qrdecoder.width; x++)
        {
            var gray = qrdecoder.getPixel(x, y);
            
            ret[x+y*qrdecoder.width] = gray;
        }
    }
    return ret;
}




function URShift( number,  bits)
{
    if (number >= 0)
        return number >> bits;
    else
        return (number >> bits) + (2 << ~bits);
}
