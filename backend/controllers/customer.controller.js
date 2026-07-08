import Customer from "../models/Customer.js";

/**
 * CREATE CUSTOMER
 * OWNER / STAFF
 */
export const createCustomer = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const { 
      name, 
      phone, 
      email,
      address,
      dateOfBirth,
      gender,
      familyGroupId, 
      category,
      notes,
      creditLimit
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const customer = await Customer.create({
      medicalStoreId,
      name,
      phone,
      email,
      address,
      dateOfBirth,
      gender,
      familyGroupId,
      category,
      notes,
      creditLimit,
      totalPurchaseAmount: 0,
      totalProfitGenerated: 0,
    });

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL CUSTOMERS
 */
export const getAllCustomers = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;

    const customers = await Customer.find({ medicalStoreId }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE CUSTOMER
 */
export const getSingleCustomer = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const customerId = req.params.id;

    const customer = await Customer.findOne({
      _id: customerId,
      medicalStoreId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE CUSTOMER
 * OWNER only
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const customerId = req.params.id;

    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: customerId, medicalStoreId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE CUSTOMER
 * OWNER only
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const customerId = req.params.id;

    const deletedCustomer = await Customer.findOneAndDelete({
      _id: customerId,
      medicalStoreId,
    });

    if (!deletedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
