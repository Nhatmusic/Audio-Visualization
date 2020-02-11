// function calculate_SmithWaterman() {
//     var totalscore = [];
//     for (h = 0; h < total_self_similarity_data.length - 1; h++) {
//         var scorefinal = [];
//         for (k = h + 1; k < total_self_similarity_data.length; k++) {
//             var result;
//             result = comparescore_SmithWaterman(total_self_similarity_data[h], total_self_similarity_data[k])
//             //Calculate distance based on SmithWaterman
//             scorefinal.push(SmithWaterman(result[0], result[1]))
//         }
//         totalscore.push(scorefinal)
//     }
// }

function comparescore_SmithWaterman(selfmatrix1, selfmatrix2) {

    var crossscore = [];
    var crossscore2 = [];

    //get distance of all pair between each datapoint of matrix1 and matrix2
    for (var i = 0; i < selfmatrix1.length; i++) {
        var crossimilarity_matrix = [];
        for (var j = 0; j < selfmatrix2.length; j++) {
            crossimilarity_matrix.push(euclideanDistance(selfmatrix1[i], selfmatrix2[j]))
        }
        crossscore.push(crossimilarity_matrix);
        crossscore2 = crossscore.slice();
    }
    return [crossscore, crossscore2];
}

function SmithWaterman(cross_similarity, crossimilarity_for_binary) {
    //Create Cross similarity Matrix from 2 SSM data
    function sortrow(cross_similarity) {
        //sort the row of cross similarity matrix then take the k*row.length point
        rowsort = [];
        for (var i = 0; i < cross_similarity.length; i++) {
            rowsort.push(cross_similarity[i].sort(function (cross_similarity, b) {
                return cross_similarity - b;
            }))
        }
        rowsortmin = [];
        number = 0;
        number = math.round(cross_similarity.length * 0.5)

        for (var i = 0; i < rowsort.length; i++) {
            rowsortmin.push(rowsort[i][number])
        }
    }


    function sortcol(cross_similarity) {
        //sort the column
        column = [];
        column = _.unzip(cross_similarity)
        sortcolumn = [];
        for (var i = 0; i < column.length; i++) {
            sortcolumn.push(column[i].sort(function (cross_similarity, b) {
                return cross_similarity - b;
            }))
        }
        number = 0;
        number = math.round(cross_similarity[0].length * 0.5)

        sortcolumnmin = [];
        for (var i = 0; i < sortcolumn.length; i++) {
            sortcolumnmin.push(sortcolumn[i][number])
        }
    }

    //draw binary matrix
    function drawbinarymatrix(crossimilarity_for_binary) {
        for (var i = 0; i < crossimilarity_for_binary.length; i++) {
            for (var j = 0; j < crossimilarity_for_binary[0].length; j++) {
                if (crossimilarity_for_binary[i][j] < math.min(rowsortmin[i], sortcolumnmin[j])) {
                    crossimilarity_for_binary[i][j] = 0;
                } else {
                    crossimilarity_for_binary[i][j] = 1;
                }
            }
        }
        return crossimilarity_for_binary;
    }

    function Delta(a, b) {
        gapOpening = -0.5;
        gapExtension = -0.7;
        if (b > 0) {
            return 0;
        } else if (b == 0 && a > 0) {
            return gapOpening;
        } else {
            return gapExtension;
        }
    }

    function Match(i) {
        matchScore = 1;
        mismatchScore = -1;

        if (i == 1) {
            return mismatchScore
        } else {
            return matchScore
        }
    }

    function score(crossimilarity_for_binary) {
        // N = crossimilarity.length[0]+1
        // M = crossimilarity.length[1]+1
        //math.zeros(math.size(A))

        arr = Array(crossimilarity_for_binary.length + 1).fill(Array(crossimilarity_for_binary[0].length + 1));
        D = math.zeros(math.size(arr))
        maxD = 0;
        for (i = 3; i < D.length; i++) {
            for (j = 3; j < D[0].length; j++) {
                MS = Match(crossimilarity_for_binary[i - 1][j - 1])
                //H_(i-1, j-1) + S_(i-1, j-1) + delta(S_(i-2,j-2), S_(i-1, j-1))
                d1 = D[i - 1][j - 1] + MS + Delta(crossimilarity_for_binary[i - 2][j - 2], crossimilarity_for_binary[i - 1][j - 1])
                //H_(i-2, j-1) + S_(i-1, j-1) + delta(S_(i-3, j-2), S_(i-1, j-1))
                d2 = D[i - 2][j - 1] + MS + Delta(crossimilarity_for_binary[i - 3][j - 2], crossimilarity_for_binary[i - 1][j - 1])
                //H_(i-1, j-2) + S_(i-1, j-1) + delta(S_(i-2, j-3), S_(i-1, j-1))
                dd3 = D[i - 1][j - 2] + MS + Delta(crossimilarity_for_binary[i - 2][j - 3], crossimilarity_for_binary[i - 1][j - 1])
                D[i][j] = math.max(d1, d2, dd3, 0)
            }
        }
        return math.max(D);
    }

    sortrow(cross_similarity);
    sortcol(cross_similarity);
    drawbinarymatrix(crossimilarity_for_binary);

    return score(crossimilarity_for_binary);

}