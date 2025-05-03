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
                        window.location.href = `/review/business_view.html?businessId=${biz.business_id}`;
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

