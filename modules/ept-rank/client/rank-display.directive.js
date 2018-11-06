var html = '{{vm.userRank}}';

var directive = [function() {
  return {
    restrict: 'E',
    scope: true,
    bindToController: { ranks: '=', maps: '=', user: '='},
    template: html,
    controllerAs: 'vm',
    controller: ['$scope', function($scope) {
      var ctrl = this;

      $scope.$watch(function() { return ctrl.user; }, function (user) {
        // calculate the rank of the user
        var metricToRankMaps = ctrl.maps;
        // map the metrics to ranks
        var ranks = Object.keys(metricToRankMaps).reduce(function(mappedRanks, metricName) {
          var rank = -1;
          for (var i = 0; i < metricToRankMaps[metricName].length; i++) {
            if (user[metricName] >= metricToRankMaps[metricName][i]) {
              rank = i;
            }
            else {
              break;
            }
          }
          mappedRanks.push(rank);
          return mappedRanks;
        }, []);
        // order the ranks and pluck the lowest rank
        ranks.sort();
        var lowestRankNumber = ranks[0];
        if (lowestRankNumber >= 0) {
          ctrl.userRank = ctrl.ranks[lowestRankNumber].name;
        }
        else {
          ctrl.userRank = '';
        }
      });
    }]
  };
}];


angular.module('ept').directive('rankDisplay', directive);
