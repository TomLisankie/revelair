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

    function getMousePosition(canvas, e) {
        let rect = canvas.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }

    $("canvas").on("mousedown", (event) => {
        let mousePosition = getMousePosition(canvas, event);
        clicked(mousePosition);
    });

    function clicked(mousePosition) {
        currentCanvas.addPoint([mousePosition.x, mousePosition.y]);
        for(let i = 0; i < 4; i++) {
            currentCanvas.addPoint([mousePosition.x + ((i+1) * 50), mousePosition.y]);
        }
        currentCanvas.draw(context);
    }

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