import {RevelareCanvas} from "./RevelareCanvas";

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("canvas");
    var currentCanvas = new RevelareCanvas();
    var context = canvas.getContext("2d");

    $(".image-load").on("change", function(event) {
        console.log("loading image");
        let reader = new FileReader();
        reader.onload = function(event) {
            resetSlider();
            currentCanvas.replaceImage(event.target.result, context);
            currentCanvas.draw(context);
        };
        reader.readAsDataURL(event.target.files[0]);

    });

    function resetSlider() {
        //TODO: Implement
        console.log("reset slider ran");
    }

    function generatePoints(pointCount) {
        for(let i = 0; i < pointCount; i++){
            currentCanvas.addPoint([Math.floor(Math.random() * RevelareCanvas.DIM_X), 
                Math.floor(Math.random() * RevelareCanvas.DIM_Y)]);
        }
    }

    generatePoints(256);
    console.log(currentCanvas.getPoints());

});