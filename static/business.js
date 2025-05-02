import { getSession } from "./session.js";

function populateBusinessForm(data) {
    document.getElementById("name").value = data.name || "";
    document.getElementById("address").value = data.address || "";
    document.getElementById("city").value = data.city || "";
    document.getElementById("state").value = data.state || "";
    document.getElementById("postal_code").value = data.postal_code || "";
    document.getElementById("latitude").value = data.latitude || "";
    document.getElementById("longitude").value = data.longitude || "";
    document.getElementById("is_open").value = data.is_open ? "true" : "false";
    document.getElementById("attributes").value = JSON.stringify(data.attributes || {}, null, 2);
    document.getElementById("categories").value = (data.categories || []).join(", ");
    document.getElementById("hours").value = JSON.stringify(data.hours || {}, null, 2);
}

function fetchBusinessDetails() {
    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("businessId");
    const accountId = sessionStorage.getItem("account_id");

    if (!businessId || !accountId) {
        alert("Missing business/account ID");
        return;
    }

    fetch(`/api/business?businessId=${businessId}&accountId=${accountId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                populateBusinessForm(data.details);
                sessionStorage.setItem("current_business_id", businessId);
            } else {
                alert("Error fetching business: " + data.error);
            }
        });
}
function updateBusiness() {
    const accountId = sessionStorage.getItem("account_id");
    const businessId = sessionStorage.getItem("current_business_id");

    if (!accountId || !businessId) {
        alert("Session expired or invalid access.");
        window.location.href = "/";
        return;
    }

    // Get all updated form values
    const data = {
        business_id: businessId,
        business_account_id: parseInt(accountId),
        name: document.getElementById("name").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        postal_code: document.getElementById("postal_code").value,
        latitude: parseFloat(document.getElementById("latitude").value),
        longitude: parseFloat(document.getElementById("longitude").value),
        is_open: document.getElementById("is_open").value === "true",
        attributes: JSON.parse(document.getElementById("attributes").value || "{}"),
        categories: document.getElementById("categories").value.split(",").map(s => s.trim()).filter(Boolean),
        hours: JSON.parse(document.getElementById("hours").value || "{}")
    };

    fetch("/api/business/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                alert("Business updated successfully!");
                window.location.href = "/manage";
            } else {
                alert("Update failed: " + res.error);
            }
        })
        .catch(err => {
            console.error("Error updating business:", err);
            alert("Unexpected error occurred.");
        });
}

window.onload = () => {
    const { accountType, accountId } = getSession();

    if (accountType !== "business" || !accountId) {
        window.location.href = "/";
        return;
    }

    const path = window.location.pathname;

    if (path.endsWith("/manage")) {
        fetch(`/api/businesses?accountId=${accountId}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    alert("Failed to fetch businesses.");
                    return;
                }

                const container = document.getElementById("businessList");
                container.innerHTML = "";

                data.businesses.forEach(biz => {
                    const bizRow = document.createElement("div");
                    bizRow.style.display = "flex";
                    bizRow.style.justifyContent = "space-between";
                    bizRow.style.borderBottom = "1px solid #eee";
                    bizRow.style.padding = "10px";

                    const text = document.createElement("span");
                    text.innerText = `${biz.name} | ${biz.address} | Rating: ${biz.stars} | Open: ${biz.is_open ? "Yes" : "No"}`;

                    const viewBtn = document.createElement("button");
                    viewBtn.innerText = "View Details";
                    viewBtn.onclick = () => {
                        window.location.href = `/manage/details?businessId=${biz.business_id}`;
                    };

                    bizRow.appendChild(text);
                    bizRow.appendChild(viewBtn);
                    container.appendChild(bizRow);
                });
            })
            .catch(err => {
                console.error("Error loading businesses:", err);
                alert("Internal error loading businesses.");
            });
    } else if (path.endsWith("/create")) {
        const form = document.getElementById("createBusinessForm");
        form.onsubmit = async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const body = {
                account_id: accountId,
                name: formData.get("name"),
                address: formData.get("address"),
                city: formData.get("city"),
                state: formData.get("state"),
                postal_code: formData.get("postal_code"),
                latitude: parseFloat(formData.get("latitude")),
                longitude: parseFloat(formData.get("longitude")),
                is_open: formData.get("is_open") === "true",
                attributes: JSON.parse(formData.get("attributes")),
                categories: formData.get("categories").split(",").map(x => x.trim()),
                hours: JSON.parse(formData.get("hours"))
            };

            try {
                const res = await fetch("/api/business/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                const data = await res.json();
                if (data.success) {
                    alert("Business created!");
                    window.location.href = "/manage";
                } else {
                    alert("Failed to create business: " + data.error);
                }
            } catch (err) {
                alert("Internal error.");
                console.error(err);
            }
        };
    } else if (window.location.pathname.includes("details")) {
        fetchBusinessDetails();
    }
};
