// let arrayCopy;
let arrayCopy;
{
    array = [];
    for (let i = 0; i < 9; i++){
        array.push(
            new Array(9).fill(null).map( x => "")//Math.floor(Math.random()*10)) //Generates random numbers
        )
    }    
}//Generate initial nested array

{
    document.write('<div class="board">');
        for (subSquare of array){
            document.write(`<div class="subSquare">`);
            for (idx in subSquare){
                document.write(`
                <form onsubmit="update(${array.indexOf(subSquare)}, ${idx}); return false">
                    <input type="text" data="${array.indexOf(subSquare)}-${idx}">
                    <input type="submit" id="subButton">
                </form>
                `);
            }
            document.write(`</div>`);
        }
    document.write('</div>');
    document.write('<button type="button" onclick="solve()">Solve!</button>')
} //Ouput array to html page

let neighbours = { //Lookup table, describes relationships to adjacent neighbours

    verticals: 
    [
        {0: [3, 6]}, {1: [4, 7]}, {2: [5, 8]},
        {3: [0, 6]}, {4: [1, 7]}, {5: [2, 8]},
        {6: [0, 3]}, {7: [1, 4]}, {8: [2, 5]},
    ],
    horizontals:
    [
        {0: [1, 2]}, {1: [0, 2]}, {2: [0, 1]},
        {3: [4, 5]}, {4: [3, 5]}, {5: [3, 4]},
        {6: [7, 8]}, {7: [6, 8]}, {8: [6, 7]},
    ]
}

let idx_neighbours = { //Lookup table, describes relationships to adjacent neighbours

    verticals:
    [
        {0: [0, 3, 6]}, {1: [1, 4, 7]}, {2: [2, 5, 8]},
        {3: [0, 3, 6]}, {4: [1, 4, 7]}, {5: [2, 5, 8]},
        {6: [0, 3, 6]}, {7: [1, 4, 7]}, {8: [2, 5, 8]}
    ],
    horizontals:
    [
        {0: [0, 1, 2]}, {1: [0, 1, 2]}, {2: [0, 1, 2]},
        {3: [3, 4, 5]}, {4: [3, 4, 5]}, {5: [3, 4, 5]},
        {6: [6, 7, 8]}, {7: [6, 7, 8]}, {8: [6, 7, 8]}
    ]
}

let checkSubsquare = (subSquare, val) => { // Checks subSquare for conflict
    return !(array[subSquare].some( digit => digit === val));
}

let checkSquare = (subSquare, val) => { //Assumes no duplicates in subsquare, checks main Square for conflict

    const vertical_subSquares = neighbours.verticals[subSquare][subSquare];
    const horizontal_subSquares = neighbours.horizontals[subSquare][subSquare];

    let idx = array[subSquare].indexOf(val);
    const vertical_idxs = idx_neighbours.verticals[idx][idx];
    const horizontal_idxs = idx_neighbours.horizontals[idx][idx];

    i_digits = [];
    horizontal_subSquares.forEach(subSquare => {
        for (idx of horizontal_idxs){
            i_digits.push(array[subSquare][idx]);
        }
    });

    j_digits = [];
    vertical_subSquares.forEach(subSquare => {
        for (idx of vertical_idxs){
            j_digits.push(array[subSquare][idx]);
        }
    });

    let cross_digits = i_digits.concat(j_digits);

    return !(cross_digits.some( digit => digit === val));
}

let update = (subSquare, idx) => { //Update() is strictly for user inputs only! Checks input against existing array values for conflicts.

    let node = document.querySelector(`[data="${subSquare}-${idx}"]`);
    let value = parseInt(node.value);
    let lag = array[subSquare][idx];

    if (value < 1 || value > 9 || !(Number.isInteger(value))){
        node.value = lag;
        return false;
    }

    if (checkSubsquare(subSquare, value)){
        array[subSquare][idx] = value;  
        if (checkSquare(subSquare, value)){ //For checksquare to work, value needs to be stored in array. If the input is invalid, checked against main square, value is updated to original value "lag"
            return true;
            // console.log('Accepted');
        } else {
            // console.log('Rejected');
            node.value = lag;
            return false;
        }
    } else {
        node.value = lag;  
        return false;
        // console.log('Rejected');
    }    
}

let next_empty = (current = { //given a head, checks array for next empty square.
    idx: 0,
    subSquare: 0
}) => {
    for (let subSquare in array){
        if (subSquare < current.subSquare){
            continue;
        } else if (subSquare.indexOf("") === -1){
            continue;
        }
        // console.log(array[subSquare]);
        for (let idx in array[subSquare]){
            if (idx < current.idx){
                // console.log(idx);
                continue;
            } else if (array[subSquare][idx] === ""){
                let next = {
                    idx: idx,
                    subSquare: subSquare
                }
                return next;
            }         
        }
    }
}

let count_sols = (subSquare, idx) => { //Provided a subSquare and idx, this function will look at 'array' and find all possible solutions

    let options = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let solutions = [];
    let orig_val = array[subSquare][idx];

    for (value of options){
        if (checkSubsquare(subSquare, value)){
                array[subSquare][idx] = value;  
                if (checkSquare(subSquare, value)){
                    solutions.push(value)
                } else {
                    continue;
                }
        } else {
            continue;
        }
    }
    array[subSquare][idx] = orig_val;
    return solutions;
}

////////////////////////////////////////

let multipleSolHead = (branch) => { //Find last head with multiple solutions
    let lastHead;
    for (head of branch){
        if (head.solutions.length > 1){
            lastHead = head;
        }
    }
    return lastHead;
}

let reset = (nextBranch) => {
    for (let subSquare in array){
        for (let idx in array[subSquare]){
            array[subSquare][idx] = arrayCopy[subSquare][idx];
        }
    }
    for (let head of nextBranch){
        array[head.subSquare][head.idx] = head.val;
    }

}

let genBranch = (prevBranch) => { //Create branch by modifying previous by exploring new solutions //this is the problem!!!
    
    let branch;
    if (prevBranch){
        prevBranch.pop(); //Popping removes last square (last square has no solutions)

    } else {
        branch = [];
    }
    
    if (!(prevBranch)){ //This condition is used to generate intial branch ie, no previous branches.

        while (true){

            const next = next_empty();
            const solutions = count_sols(next.subSquare, next.idx);
    
            const twig = {
                idx: next.idx,
                subSquare: next.subSquare,
                solutions: solutions,
                numVisited: 0
            };
    
            branch.push(twig);
        
            if (twig.solutions.length > 0){
                array[twig.subSquare][twig.idx] = twig.solutions[0];
                twig.val = twig.solutions[0];
            } else {
                return branch;
            }

        }

    } else {

        let nextBranch = [...prevBranch]; // Assigned for ease of readability        
        let beforeHead = multipleSolHead(nextBranch);
        let idx = nextBranch.indexOf(beforeHead);

        nextBranch.splice(idx); // Read below...        
        /*        
          - Splits the nextBranch such that the last element is the one before the beforeHead.
          - This is so that the beforeHead value can be modified and appended to the next branch.    
        */

        if (beforeHead.solutions.length - 1 > beforeHead.numVisited){ 

            beforeHead.numVisited++; //Iterating means a new branch is explored!!
            beforeHead.val = beforeHead.solutions[beforeHead.numVisited];  
            array[beforeHead.subSquare][beforeHead.idx] = beforeHead.solutions[0]; 
        
            nextBranch.push(beforeHead);

        } else {

            do {
                beforeHead = multipleSolHead(nextBranch);
                idx = nextBranch.indexOf(beforeHead);

                nextBranch.splice(idx);
                beforeHead.numVisited++; //Iterating means a new branch is explored!!
                beforeHead.val = beforeHead.solutions[beforeHead.numVisited]; 
                array[beforeHead.subSquare][beforeHead.idx] = beforeHead.solutions[0]; 

            } while (!beforeHead.solutions[beforeHead.numVisited])

            nextBranch.push(beforeHead);             
            reset(nextBranch);  
        }

        while (true){

            const next = next_empty();
            let solutions;
            let twig;

            if (next){

                solutions = count_sols(next.subSquare, next.idx);

                twig = {
                    idx: next.idx,
                    subSquare: next.subSquare,
                    solutions: solutions,
                    numVisited: 0
                };

                nextBranch.push(twig);
        
                if (twig.solutions.length > 0){
                    array[twig.subSquare][twig.idx] = twig.solutions[0];
                    twig.val = twig.solutions[0];
                } else {
                    return nextBranch;
                }   

            } else {
                return;
            }
        }
    }
}

let complete = () => { // Checks array for game completion
    for (subSquare of array){
        return (subSquare.some(digit => digit === ""));
    }
}

let findPrevBranch = (Tree) => {

    let lengthTree = Tree.length;
    let lastBranch2;

    if (Tree[lengthTree-1]){
        lastBranch2 = Tree[lengthTree-1];    
    } else {
        return false;
    }    

    let lastBranch = [...lastBranch2];
    return lastBranch;
} //Takes tree and returns last branch

let seeArray = (array) => {
    for (subSquare in array){
        for (let idx in array[subSquare]){
            let node = document.querySelector(`[data="${subSquare}-${idx}"]`);
            node.value = array[subSquare][idx];
        }        
    }
}

let solve = () => {  

    
    let Tree = [];
    console.log(Tree);
    arrayCopy = JSON.parse(JSON.stringify(array));
    
    {
        let branch = genBranch();
        Tree.push(branch);
    }  

    let prevBranch = JSON.parse(JSON.stringify(findPrevBranch(Tree)));
    let branch = genBranch(prevBranch);
    Tree.push(branch);

    // console.log(Tree);
    /* Goal is to have while loop of the blocks below until game is completed. Using complete()*/
      
    // let prevBranch;
    // let branch;
    while (true){
        prevBranch = JSON.parse(JSON.stringify(findPrevBranch(Tree))); //JSON.parse BS was just to clone prevBranch to a independent memory allocation. Did solve a problem.
        if (prevBranch) {
            branch = genBranch(prevBranch); //Array
            Tree.push(branch);
        } else {
            seeArray(array);
            return;
        }

        if (complete()){
            seeArray(array);
            return;
        };
    }  

    // let prevBranch = JSON.parse(JSON.stringify(findPrevBranch(Tree))); //JSON.parse BS was just to clone prevBranch to a independent memory allocation. Did solve a problem.
    // let branch = genBranch(prevBranch);
    // Tree.push(branch);

    // prevBranch = JSON.parse(JSON.stringify(findPrevBranch(Tree))); //JSON.parse BS was just to clone prevBranch to a independent memory allocation. Did solve a problem.
    // branch = genBranch(prevBranch);
    // Tree.push(branch);

    // prevBranch = JSON.parse(JSON.stringify(findPrevBranch(Tree))); //JSON.parse BS was just to clone prevBranch to a independent memory allocation. Did solve a problem.
    // branch = genBranch(prevBranch);
    // Tree.push(branch);

    // prevBranch = JSON.parse(JSON.stringify(findPrevBranch(Tree))); //JSON.parse BS was just to clone prevBranch to a independent memory allocation. Did solve a problem.
    // branch = genBranch(prevBranch);
    // Tree.push(branch);

    // prevBranch = JSON.parse(JSON.stringify(findPrevBranch(Tree))); //JSON.parse BS was just to clone prevBranch to a independent memory allocation. Did solve a problem.
    // branch = genBranch(prevBranch);
    // Tree.push(branch);

    console.log(Tree);


}

