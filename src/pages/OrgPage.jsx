/* eslint-disable react/prop-types */
import { useState, useEffect } from "react"
import FileUpload from "@/components/FileUpload";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogTitle,DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getOrgNameMethod } from "@/contract/vault/methods";
import { addNewDocumentRequestSendMethod } from "@/contract/vault/methods2";
import useWallet from '@/hooks/useWallet';
import { v4 as uuidv4 } from 'uuid';
import { getAllNFTs } from '../contract/methods';
import { fetchMetadataFromIPFS } from '../utils/fetchMetadataFromIPFS';
import { extractIpfsHash } from '../utils/extractIpfsHash';
import { useQuery } from 'react-query';
import { FileCard } from './ProfileView';

function OrgPage() {
  const { address, signer } = useWallet(); 

  const { orgAddress } = useParams();

  const [ orgName, setOrgName ] = useState('');

  const [ documentType, setDocumentType ] = useState("");

  const [ title, setTitle ] = useState('');
  const [ description, setDescription ] = useState('');

  const getNameFromAddress = async () => {
    const name2 = await getOrgNameMethod(address, orgAddress);
    setOrgName(name2);
  }

  useEffect(() => {
    getNameFromAddress();
  },[]);

  const onSubmitRequestVerification = () => {
    // TODO: get all files and filter by org name.
  }

  const onNewDocumentRequest = async () => {
    if (!title || !description || !documentType) {
      toast.error("Please fill all the fields");
      return
    }
    const uniqueId = uuidv4();
    await toast.promise(
      addNewDocumentRequestSendMethod(signer, orgAddress, uniqueId, title, description, '', documentType),
      {
        pending: 'Adding new document request..',
        success: 'Request added',
      }
    )
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Only PNG, JPG, and JPEG are allowed.");
        return;
      }

      const maxSizeInBytes = 50 * 1024;
      if (file.size > maxSizeInBytes) {
        toast.error("File size exceeds 50KB.");
        return;
      }

      console.log("File is valid", file);
    }
  };


  const fetchFiles = async () => {
    const walletAddress = localStorage.getItem('walletAddress');
    const result = await getAllNFTs(walletAddress);
    const tokenPromises = result.map(async (token) => {
        const hash = extractIpfsHash(token.tokenURI)
        const metadata = await fetchMetadataFromIPFS(hash);
        return { ...token, metadata };
    });

    const tokensWithMetadata = await Promise.all(tokenPromises);

    const final = tokensWithMetadata.filter((token) => token.metadata.attributes[2].value === orgAddress);
    return final;
  }

  const { data: filesData, isLoading: filesLoading, refetch: filesRefetch } = useQuery(`org-${orgAddress}`, fetchFiles, { enabled: false });

  useEffect(() => {
    filesRefetch();
  }, [])


  return (
    <div className="bg-gray-900 h-screen px-16 flex flex-col gap-6">
      <ToastContainer />

      <div className="flex justify-between pt-3 items-center ">
        <h1 className="text-gray-300 font-bold text-2xl">{orgName}</h1>
        <Dialog>
          <DialogTrigger>
            <button
              className="bg-[#27E8A7] text-black font-bold py-2 px-6 rounded-md hover:bg-[#20C08F] transition-colors"
            >
              New File
            </button>
          </DialogTrigger>
          <DialogTitle className="hidden"></DialogTitle>
          <DialogContent className="bg-gray-200">
              <Tabs defaultValue="new" className="w-full mt-4">
                <div className="flex justify-start mb-8">
                  <TabsList className="grid w-full h-min grid-cols-2 bg-gray-800 text-white">
                    <TabsTrigger value="new" className="py-1.5 text-sm flex items-center justify-center">
                      New Document
                    </TabsTrigger>
                    <TabsTrigger value="verify" className="py-1.5 text-sm flex items-center justify-center">
                      Verification Request
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="new">
                    <div>
                      <input 
                        type="text" 
                        placeholder="Title" 
                        className="rounded-lg w-full p-2 mb-4 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:border-primaryColor" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Description" 
                        className="rounded-lg w-full p-2 mb-4 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:border-primaryColor" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select Doc Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Bonafide">Bonafide Certificate</SelectItem>
                            <SelectItem value="Merit">Merit Award Certificate</SelectItem>
                            <SelectItem value="Medical">Medical Certificate</SelectItem>
                            <SelectItem value="Employment-Proof">Proof of Employment</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex justify-end mt-8">
                        <button
                          type="submit"
                          onClick={onNewDocumentRequest}
                          className="bg-primaryGreen text-black font-medium px-4 py-2 rounded"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                </TabsContent>
                <TabsContent value="verify">
                    <div>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select Doc Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BONAFIDE">Bonafide Certificate</SelectItem>
                          <SelectItem value="MERIT">Merit Award Certificate</SelectItem>
                          <SelectItem value="MEDICAL">Medical Certificate</SelectItem>
                          <SelectItem value="SCHOOL">School leaving Certificate</SelectItem>
                          <SelectItem value="LOR">Letter of Recommendation</SelectItem>
                          <SelectItem value="APPOINTMENT">Appointment letter</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="mb-4 mt-5">
                        <FileUpload onChange={handleFileChange} />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-primaryGreen text-black font-medium px-4 py-2 rounded"
                          onClick={onSubmitRequestVerification}
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                </TabsContent>
              </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {
          filesLoading && (
            <div className='w-full rounded-2xl px-3 py-4 text-gray-400 gap-2 justify-between flex'>
              <span className='font-bold text-2xl'>Loading...</span>
            </div>
          ) 
        }
        {
          filesLoading || filesData === undefined 
          ? null
          : filesData.length === 0
            ? (
              <div className='w-full rounded-2xl px-3 py-4 text-gray-400 gap-2 justify-between flex'>
                <span className='font-bold text-2xl'>No Files</span>
              </div>
            ): (
              filesData.map((file, index) => (
                <FileCard key={index} name={file.metadata.name} imageUrl={file.metadata.image} />
              ))
            )
        }
      </div>
    </div>
  )
}
export default OrgPage
