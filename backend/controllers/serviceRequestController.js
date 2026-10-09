const ServiceRequest = require("../models/ServiceRequest");

// Create Service Request
const createServiceRequest = async (req, res) => {
try {
const { serviceType, description, address, preferredDate } = req.body;

```
if (!serviceType || !description || !address) {
  return res.status(400).json({
    message: "Please provide service type, description and address",
  });
}

if (!["electrical", "plumbing"].includes(serviceType)) {
  return res.status(400).json({
    message: "Service type must be electrical or plumbing",
  });
}

const request = await ServiceRequest.create({
  customer: req.user.id,
  serviceType,
  description,
  address,
  preferredDate: preferredDate || undefined,
});

return res.status(201).json({
  message: "Service Request successfully submitted",
  request,
});
```

} catch (error) {
console.error("Create service request error:", error.message);
return res.status(500).json({
message: "Failed to create service request",
});
}
};

// Get Service Requests
const getServiceRequests = async (req, res) => {
try {
let filter = {};

```
if (req.user.role === "customer") {
  filter.customer = req.user.id;
} else if (req.user.role === "technician") {
  filter.assignedTechnician = req.user.id;
}

const requests = await ServiceRequest.find(filter)
  .populate("customer", "name email phone")
  .populate("assignedTechnician", "name email phone")
  .sort({ createdAt: -1 });

return res.json({ requests });
```

} catch (error) {
console.error("Get service requests error:", error.message);
return res.status(500).json({
message: "Failed to get service requests",
});
}
};

// Update Service Request Status
const updateServiceRequestStatus = async (req, res) => {
try {
if (!["admin", "technician"].includes(req.user.role)) {
return res.status(403).json({
message: "Not authorized to update service request status",
});
}

```
const { status } = req.body;
const allowedStatuses = [
  "pending",
  "assigned",
  "inspection",
  "approved",
  "in-progress",
  "completed",
  "cancelled",
];

if (!allowedStatuses.includes(status)) {
  return res.status(400).json({
    message: "Invalid service request status",
  });
}

const request = await ServiceRequest.findById(req.params.id);

if (!request) {
  return res.status(404).json({
    message: "Service request not found",
  });
}

if (
  req.user.role === "technician" &&
  String(request.assignedTechnician) !== String(req.user.id)
) {
  return res.status(403).json({
    message: "This request is not assigned to you",
  });
}

request.status = status;
await request.save();

return res.json({
  message: "Service request status updated successfully",
  request,
});
```

} catch (error) {
console.error("Update service request error:", error.message);
return res.status(500).json({
message: "Failed to update service request status",
});
}
};

module.exports = {
createServiceRequest,
getServiceRequests,
updateServiceRequestStatus,
};
