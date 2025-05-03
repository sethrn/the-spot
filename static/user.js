import { getSession } from "./session.js";

window.searchBusinesses = searchBusinesses;
let currentPage = 0;
const pageSize = 20;

function searchBusinesses() {
    const name = document.getElementById("nameInput").value.trim();
    const state = document.getElementById("stateSelect").value;
    const is_open_raw = document.getElementById("openSelect").value;
    const is_open = is_open_raw === "true" ? true : null;

    const payload = {
        name: name || null,
        state: state || null,
        is_open,
        page_size: pageSize,
        page: currentPage
    };

    fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("businessList");
            container.innerHTML = "";

            if (data.businesses && data.businesses.length > 0) {
                data.businesses.forEach(biz => {
                    const bizRow = document.createElement("div");
                    bizRow.style.display = "flex";
                    bizRow.style.justifyContent = "space-between";
                    bizRow.style.borderBottom = "1px solid #eee";
                    bizRow.style.padding = "10px";

                    const text = document.createElement("span");
                    text.innerText = `${biz.name} | ${biz.address} | Rating: ${biz.stars} | Reviews: ${biz.review_count} | Open: ${biz.is_open ? "Yes" : "No"}`;

                    const viewBtn = document.createElement("button");
                    viewBtn.innerText = "View Details";
                    viewBtn.onclick = () => {
                        window.location.href = `/search/details?businessId=${biz.business_id}`;
                    };

                    bizRow.appendChild(text);
                    bizRow.appendChild(viewBtn);
                    container.appendChild(bizRow);
                });
            } else {
                container.innerHTML = "<p>No results found.</p>";
            }

            document.getElementById("pageLabel").innerText = `Page ${currentPage + 1}`;
        });
}

document.getElementById("prevPageBtn").onclick = () => {
    if (currentPage > 0) {
        currentPage--;
        searchBusinesses();
    }
};

document.getElementById("nextPageBtn").onclick = () => {
    currentPage++;
    searchBusinesses();
};
function populateBusinessDetails(data) {
    document.getElementById("bizName").innerText = data.name || "";
    document.getElementById("bizAddress").innerText = data.address || "";
    document.getElementById("bizLocation").innerText = `${data.city || ""}, ${data.state || ""} ${data.postal_code || ""}`;
    document.getElementById("bizStars").innerText = data.stars?.toFixed(1) || "N/A";
    document.getElementById("bizReviewCount").innerText = data.review_count ?? "0";
    document.getElementById("bizIsOpen").innerText = data.is_open ? "Open" : "Closed";
    document.getElementById("bizCategories").innerText = (data.categories || []).join(", ");
    document.getElementById("bizAttributes").innerText = JSON.stringify(data.attributes || {}, null, 2);
    document.getElementById("bizHours").innerText = JSON.stringify(data.hours || {}, null, 2);
}

function populateTips(tips) {
    const tipList = document.getElementById("tipList");
    tipList.innerHTML = "";

    tips.forEach(tip => {
        const tipBox = document.createElement("div");
        tipBox.className = "entry-box";

        const header = document.createElement("div");
        header.className = "entry-header";
        header.innerText = `${tip.name} (Praises: ${tip.praise_count ?? 0})`;

        const text = document.createElement("div");
        text.innerText = tip.text;

        tipBox.appendChild(header);
        tipBox.appendChild(text);
        tipList.appendChild(tipBox);
    });
}

function populateReviews(reviews) {
    const reviewList = document.getElementById("reviewList");
    reviewList.innerHTML = "";

    reviews.forEach(review => {
        const reviewBox = document.createElement("div");
        reviewBox.className = "entry-box";

        const header = document.createElement("div");
        header.className = "entry-header";
        header.innerText = `${review.name} (Useful: ${review.useful ?? 0} | Funny: ${review.funny ?? 0} | Cool: ${review.cool ?? 0})`;

        const text = document.createElement("div");
        text.innerText = review.text;

        reviewBox.appendChild(header);
        reviewBox.appendChild(text);
        reviewList.appendChild(reviewBox);
    });
}

function addReview() {
    const { accountType, accountId } = getSession();
    const businessId = new URLSearchParams(window.location.search).get("businessId");
    const text = document.getElementById("newReviewText").value.trim();

    if (!accountId || !businessId || !text) {
        alert("Missing required information for review.");
        return;
    }

    const payload = {
        user_id: accountId,
        business_id: businessId,
        text: text
    };

    fetch("/api/business/review", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                alert("Review submitted!");
                window.location.reload();
            } else {
                alert("Failed to post review: " + res.error);
            }
        });
}

function addTip() {
    const { accountType, accountId } = getSession();
    const businessId = new URLSearchParams(window.location.search).get("businessId");
    const text = document.getElementById("newTipText").value.trim();

    if (!accountId || !businessId || !text) {
        alert("Missing required information for tip.");
        return;
    }

    const payload = {
        user_id: accountId,
        business_id: businessId,
        text: text
    };

    fetch("/api/business/tip", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                alert("Tip submitted!");
                window.location.reload();
            } else {
                alert("Failed to post tip: " + res.error);
            }
        });
}


window.onload = () => {
    const { accountType, accountId } = getSession();

    const path = window.location.pathname;

    if (path === "/search/details") {

        if (!accountId) {
            window.location.href = "/";
            return;
        }
        console.log("Running /search/details logic");

        const params = new URLSearchParams(window.location.search);
        const businessId = params.get("businessId");

        if (!businessId) {
            alert("No business specified.");
            return;
        }

        fetch(`/api/search/business?businessId=${businessId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    console.log("Running /search/details logic");

                    populateBusinessDetails(data.details);
                    populateReviews(data.reviews);
                    populateTips(data.tips);
                } else {
                    alert("Failed to load business details: " + data.error);
                }
            })
            .catch(err => console.error("Fetch error:", err));
    }
};

window.addReview = addReview;
window.addTip = addTip;
