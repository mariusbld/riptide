import React, { FC } from "react";
import { Fragment, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { CheckCircleIcon, CheckIcon } from "@heroicons/react/outline";
import Button from "./Button";

interface props {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
}

const Modal: FC<props> = ({ open, setOpen, onConfirm }) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        onClose={setOpen}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="relative inline-block align-bottom dark:bg-modal-bg-dark rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="dark:bg-modal-bg-dark px-4 pt-5 pb-4 sm:p-10 sm:pb-6">
                <div className="sm:flex sm:items-start flex-col">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-full bg-green-500 sm:mx-0 sm:h-12 sm:w-12">
                    <CheckIcon
                      className="h-7 w-7 dark:text-modal-bg-dark"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-4 sm:ml-0 sm:text-left">
                    <Dialog.Title
                      as="h2"
                      className="text-2xl leading-6 font-medium dark:text-modal-dark"
                    >
                      Campaign Created!
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Your campaign was successfully created! You can now
                        navigate to the campaign details page in order to add
                        funds and start it.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="my-4">
                  <Button onClick={onConfirm} small>
                    Campaign Details
                  </Button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Modal;
