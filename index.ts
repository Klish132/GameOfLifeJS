class Cell {
    public isAlive: boolean;
    private nextStatus: boolean;

    private age: number;
    public posX: number;
    public posY: number;

    public neighborsArray: Cell[];

    private context: CanvasRenderingContext2D;

    constructor(isAlive: boolean, x: number, y: number, context: CanvasRenderingContext2D) {
        this.posX = x;
        this.posY = y;
        this.age = 0;
        this.isAlive = isAlive;
        this.nextStatus = isAlive;

        this.neighborsArray = [];

        this.context = context;
    }

    public setNextStatus(): boolean {
        let aliveNeighborsCount = 0;
        let statusHasChanged = false;
        for(let neighbor of this.neighborsArray) {
            if (neighbor.isAlive) {
                aliveNeighborsCount++;
            }
        }
        if (this.isAlive) {
            if (aliveNeighborsCount < 2 || aliveNeighborsCount > 3) {
                this.nextStatus = false;
                statusHasChanged = true;
            } else {
                this.age++;
                this.nextStatus = true;
            }
        } else {
            if (aliveNeighborsCount == 3) {
                this.nextStatus = true;
                statusHasChanged = true;
            } else {
                this.nextStatus = false;
            }
        }
        return statusHasChanged;
    }

    public update(): void {
        if (this.nextStatus == true && !this.isAlive) {
            this.resurrect()
        } else if (this.nextStatus == false && this.isAlive) {
            this.die();
        }
    }

    public die(): void {
        this.nextStatus = false;
        this.isAlive = false;
    }

    public resurrect(): void {
        this.nextStatus = true;
        this.isAlive = true;
        this.age = 0;
    }

    public draw(): void {
        if (this.isAlive) {
            this.context.fillStyle = "black";
            this.context.fillRect(this.posX * 10, this.posY * 10, 10, 10);
        } else {
            this.context.fillStyle = "gray";
            this.context.fillRect(this.posX * 10, this.posY * 10, 10, 10);
        }
        
    }
}

class Game {
    private cellArray: Cell[][];
    private livingCellsArray: Cell[];

    private fieldWidth: number;
    private fieldHeight: number;

    private iterationNumber: number = 0;

    private isPaused: boolean = true;
    private currentGameSpeed: number = 1000;
    private timerID: number;

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private containerElement: HTMLElement;
    private widthInput: HTMLInputElement;
    private heightInput: HTMLInputElement;
    private speedInput: HTMLInputElement;

    private setDimensionsButton: HTMLElement;
    private populateButton: HTMLElement;
    private flyersButton: HTMLElement;
    private clearButton: HTMLElement;
    private resumeButton: HTMLElement;
    private pauseButton: HTMLElement;
    private oneIterationButton: HTMLElement;

    constructor(width: number, height: number) {
        this.fieldWidth = width;
        this.fieldHeight = height;

        this.canvas = <HTMLCanvasElement> document.getElementById("field");
        this.context = this.canvas.getContext("2d");

        this.containerElement = document.getElementById("container");
        this.widthInput = document.getElementById("width-input") as HTMLInputElement;
        this.heightInput = document.getElementById("height-input") as HTMLInputElement;
        this.speedInput = document.getElementById("speed-input") as HTMLInputElement;
        this.speedInput.addEventListener("input", this.changeGameSpeed.bind(this));

        this.setDimensionsButton = document.getElementById("set-dimensions-button");
        this.setDimensionsButton.addEventListener("click", this.setCanvasDimensions.bind(this));
        this.populateButton = document.getElementById("populate-button");
        this.populateButton.addEventListener("click", this.randomlyPopulateField.bind(this));
        this.flyersButton = document.getElementById("flyers-button");
        this.flyersButton.addEventListener("click", this.populateWithFlyers.bind(this));
        this.clearButton = document.getElementById("clear-button");
        this.clearButton.addEventListener("click", this.resetGame.bind(this));
        this.resumeButton = document.getElementById("resume-button");
        this.resumeButton.addEventListener("click", this.resumeGame.bind(this));
        this.pauseButton = document.getElementById("pause-button");
        this.pauseButton.addEventListener("click", this.pauseGame.bind(this));
        this.oneIterationButton = document.getElementById("one-iteration-button");
        this.oneIterationButton.addEventListener("click", this.doOneIteration.bind(this));
    }

    private setCanvasDimensions(): void {
        this.resetGame();
        let newWidth = parseInt(this.widthInput.value) * 10;
        let newHeight = parseInt(this.heightInput.value) * 10;
        this.fieldWidth = parseInt(this.widthInput.value);
        this.fieldHeight = parseInt(this.heightInput.value);
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.containerElement.style.width = (newWidth + 200).toString() + "px";
        this.containerElement.style.height = (newHeight + 200).toString() + "px";
    }

    private changeGameSpeed(): void {
        let speedInSeconds = parseFloat(this.speedInput.value);
        let newSpeed = Math.floor(speedInSeconds * 1000);
        this.currentGameSpeed = newSpeed;
    }

    private resumeGame(): void {
        if (this.isPaused) {
            this.isPaused = false;
            this.doIteration();
            this.timerID = setTimeout(() => this.updateTimer(), this.currentGameSpeed);
        }
    }

    private pauseGame(): void {
        if (!this.isPaused) {
            this.isPaused = true;
            clearTimeout(this.timerID);
        }
    }

    private updateTimer(): void {
        if (!this.isPaused) {
            this.doIteration();
            setTimeout(() => this.updateTimer(), this.currentGameSpeed);
        }
    }

    private doOneIteration(): void {
        this.pauseGame();
        this.doIteration();
    }

    private doIteration(): void {
        this.iterationNumber++;
        let cellsToSetNextStatus: Cell[] = [];
        for (let livingCell of this.livingCellsArray) {
            for(let neighbor of livingCell.neighborsArray) {
                if (!cellsToSetNextStatus.includes(neighbor)) {
                    cellsToSetNextStatus.push(neighbor);
                }
            }
            if (!cellsToSetNextStatus.includes(livingCell)) {
                cellsToSetNextStatus.push(livingCell);
            }
        }
        let cellsToUpdate: Cell[] = [];
        for(let cell of cellsToSetNextStatus) {
            if (cell.setNextStatus()) {
                cellsToUpdate.push(cell);
            }
        }
        
        for (let cell of cellsToUpdate) {
            cell.update();
            if (cell.isAlive) {
                this.createCellNeighbors(cell);
                this.appendLivingCell(cell);
            } else {
                this.removeLivingCell(cell);
            }
        }
        this.redrawField();
    }

    private redrawField(): void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        /*
        for(let row of this.cellArray) {
            for (let cell of row) {
                if (cell != undefined)
                    cell.draw();
            }
        }
        */
        for (let livingCell of this.livingCellsArray) {
            livingCell.draw();
        }
    }

    private appendLivingCell(cell: Cell): void {
        if (!this.livingCellsArray.includes(cell)) {
            this.livingCellsArray.push(cell);
        }
    }

    private removeLivingCell(cell: Cell): void {
        this.livingCellsArray.splice(this.livingCellsArray.indexOf(cell), 1);
    }

    private fillNeighborsArrayForCell(cell: Cell): void {
        let horMin = cell.posX - 1; let horMax = cell.posX + 1;
        for(let x = horMin; x <= horMax; x++) {
            let vertMin = cell.posY - 1; let vertMax = cell.posY + 1;
            for(let y = vertMin; y <= vertMax; y++) {
                let coordX = x; let coordY = y;
                if (coordX < 0)
                    coordX = this.fieldWidth - 1;
                else if (x > this.fieldWidth - 1)
                    coordX = 0;
                if (coordY < 0)
                    coordY = this.fieldHeight - 1;
                else if (coordY > this.fieldHeight - 1)
                    coordY = 0;
                if (coordX != cell.posX || coordY != cell.posY) {
                    if (this.cellArray[coordX][coordY] == undefined) {
                        this.createNewCell(false, false, coordX, coordY);
                    }
                    let newNeighbor = this.cellArray[coordX][coordY];
                    if (!cell.neighborsArray.includes(newNeighbor))
                        cell.neighborsArray.push(newNeighbor);
                }
            }
        }
    }

    private createCellNeighbors(cell: Cell): void {
        if (cell.neighborsArray.length < 8) {
            this.fillNeighborsArrayForCell(cell);
        }
        for (let neighbor of cell.neighborsArray) {
            this.fillNeighborsArrayForCell(neighbor);
        }
        
    }

    private createNewCell(isAlive: boolean, createNeighbors: boolean, x: number, y: number): void {
        let cell = new Cell(isAlive, x, y, this.context);
        this.cellArray[x][y] = cell;
        if (isAlive) {
            this.appendLivingCell(cell);
            cell.draw();
        }
        if (createNeighbors) {
            this.createCellNeighbors(cell);
        }
    }

    private resetGame(): void {
        this.pauseGame();
        this.cellArray = [];
        this.livingCellsArray = [];
        
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.cellArray = [];
        for (let i = 0; i < this.fieldWidth; i++) {
            this.cellArray[i] = [];
            for (let j = 0; j < this.fieldHeight; j++) {
                this.cellArray[i][j] = undefined;
            }
        }
    }

    private setCellAt(x: number, y: number): void {
        let cell = this.cellArray[x][y];
        if (cell == undefined) {
            this.createNewCell(true, true, x, y);
        } else {
            if (!cell.isAlive) {
                cell.resurrect();
                this.createCellNeighbors(cell);
                this.appendLivingCell(cell);
                cell.draw();
            } else {
                cell.die();
                this.removeLivingCell(cell);
                this.redrawField();
            }
        }
    }

    private populateWithFlyers(): void {
        this.resetGame();
        this.setCellAt(3, 3);
        this.setCellAt(4, 4);
        this.setCellAt(5, 2);
        this.setCellAt(5, 3);
        this.setCellAt(5, 4);

        this.setCellAt(8, 3);
        this.setCellAt(9, 4);
        this.setCellAt(10, 2);
        this.setCellAt(10, 3);
        this.setCellAt(10, 4);

        this.setCellAt(13, 3);
        this.setCellAt(14, 4);
        this.setCellAt(15, 2);
        this.setCellAt(15, 3);
        this.setCellAt(15, 4);

        this.setCellAt(18, 3);
        this.setCellAt(19, 4);
        this.setCellAt(20, 2);
        this.setCellAt(20, 3);
        this.setCellAt(20, 4);
        this.redrawField();
    }

    private randomlyPopulateField(): void {
        this.resetGame();
        let totalCellCount = this.fieldWidth * this.fieldHeight;
        let percentage = 0.4;
        let amountToPopulate = Math.floor(totalCellCount * percentage);

        for (let i = 0; i < amountToPopulate; i ++) {
            let randomX = this.GetRandomNumber(0, this.fieldWidth - 1);
            let randomY = this.GetRandomNumber(0, this.fieldHeight - 1);

            let cell = this.cellArray[randomX][randomY];
            if (cell == undefined) {
                this.createNewCell(true, true, randomX, randomY);
            } else {
                if (!cell.isAlive) {
                    cell.resurrect();
                    this.createCellNeighbors(cell);
                    this.appendLivingCell(cell);
                    cell.draw();
                } else {
                    i--;
                }
            }
        }
    }

    private GetRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

const game = new Game(60, 50);