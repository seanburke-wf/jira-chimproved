// ==UserScript==
// @name            JIRA chImproved
// @version         0.1.0
// @namespace       https://github.com/leftmostcat/
// @description     Add handy functionality to the JIRA Agile/Kanban boards
// @include         */RapidBoard.jspa*
// ==/UserScript==

const $ = window.AJS.$;
const GH = window.GH;

function populatePRLinks() {
    const rapidViewId = GH.RapidBoard.State.data.rapidViewId;
    const issues = GH.WorkDataLoader.getDataForViewId(rapidViewId).data.issuesData.issues;

    const issuesToCheckForPR = issues.filter((issue) =>
        issue.statusName !== 'Open' && issue.statusName !== 'Closed'
    );

    const githubPullRegex =  /^http.*github.com\/.*\/pull\/.*/;

    issuesToCheckForPR.forEach((issue) => {
        const issueKey = issue.key;

        $.ajax(`/rest/api/2/issue/${issueKey}/remotelink`)
            .then((links) => {
                const githubLinks = links.filter((link) =>
                    githubPullRegex.test(link.object.url)
                );

                if (!githubLinks.length) {
                    return;
                }

                const $issueEndDiv = $(`.ghx-issue[data-issue-key=${issueKey}] .ghx-end`);
                const $prDiv = $issueEndDiv.append($('<div class="jchi-prs"></div>'));

                githubLinks.forEach((link) => {
                    const linkTitle = link.object.summary || link.object.title;
                    const $linkAnchor = $prDiv.append($(`<a href="${link.object.url}"></a>`));
                    $linkAnchor.append($(`<img style="cursor: pointer; float: left; margin-right: 2px;" title="${linkTitle}" width=16 height=16 src="${link.object.icon.url16x16}">`));

                    $linkAnchor.on('click', () => {
                        window.open(link.object.url, '_blank');
                    });
                });
            });
    });

    GH.CallbackManager.registerCallback(GH.WorkController.CALLBACK_POOL_RENDERED, 'SelectMostAppropriateIssueCallback', populatePRLinks);
}

GH.CallbackManager.registerCallback(GH.WorkController.CALLBACK_POOL_RENDERED, 'SelectMostAppropriateIssueCallback', populatePRLinks);
