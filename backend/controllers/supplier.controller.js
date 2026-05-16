import Supplier from "../models/Supplier.js";

/**
 * CREATE SUPPLIER
 * OWNER / STAFF
 */
export const createSupplier = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const { name, phone, email, address, gstNumber, creditDays } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required",
      });
    }

    const supplier = await Supplier.create({
      medicalStoreId,
      name,
      phone,
      email,
      address,
      gstNumber,
      creditDays,
    });

    res.status(201).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL SUPPLIERS
 * Any authenticated user
 */
export const getAllSuppliers = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;

    const suppliers = await Supplier.find({ medicalStoreId }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE SUPPLIER
 */
export const getSingleSupplier = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const supplierId = req.params.id;

    const supplier = await Supplier.findOne({
      _id: supplierId,
      medicalStoreId,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE SUPPLIER
 * OWNER only
 */
export const updateSupplier = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const supplierId = req.params.id;

    const updatedSupplier = await Supplier.findOneAndUpdate(
      { _id: supplierId, medicalStoreId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedSupplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE SUPPLIER
 * OWNER only
 */
export const deleteSupplier = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const supplierId = req.params.id;

    const deletedSupplier = await Supplier.findOneAndDelete({
      _id: supplierId,
      medicalStoreId,
    });

    if (!deletedSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
